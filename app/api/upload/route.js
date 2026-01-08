import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limiter';
import { logSecurityEvent, getSecurityInfo } from '@/lib/security';
import { validateUpload, sanitizeFilename, getFileExtension } from '@/lib/file-validator';

// Allowed MIME types for this upload endpoint
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
];

export async function POST(req) {
    // Apply rate limiting - 5 uploads per minute
    const rateLimit = applyRateLimit(req, rateLimiters.upload);
    if (rateLimit.limited) {
        logSecurityEvent('RATE_LIMIT_UPLOAD', getSecurityInfo(req));
        return NextResponse.json(
            rateLimit.response.body,
            {
                status: rateLimit.response.status,
                headers: rateLimit.response.headers,
            }
        );
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            logSecurityEvent('UNAUTHORIZED_UPLOAD_ATTEMPT', getSecurityInfo(req));
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert file to buffer for validation
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Comprehensive file validation (magic bytes, extensions, size)
        const validation = await validateUpload(file, buffer, {
            allowedMimeTypes: ALLOWED_MIME_TYPES,
            maxSize: 100 * 1024 * 1024 // 100MB
        });

        if (!validation.valid) {
            logSecurityEvent('MALICIOUS_FILE_BLOCKED', {
                ...getSecurityInfo(req),
                filename: file.name,
                mimeType: file.type,
                error: validation.error
            });
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'notes');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate secure filename using UUID
        const uniqueId = randomUUID().replace(/-/g, '').substring(0, 12);
        const safeOriginalName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, '').substring(0, 50));
        const extension = getFileExtension(file.name);
        const filename = `${safeOriginalName}_${uniqueId}.${extension}`;
        const filepath = path.join(uploadDir, filename);

        // Save file
        await writeFile(filepath, buffer);

        // Return public URL
        const url = `/uploads/notes/${filename}`;
        return NextResponse.json({ url, filename }, { status: 201 });

    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file', details: error.message }, { status: 500 });
    }
}

