import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limiter';
import { logSecurityEvent, getSecurityInfo } from '@/lib/security';
import { validateUpload, sanitizeFilename } from '@/lib/file-validator';

// Allowed MIME types for forum posts
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

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        const posts = await prisma.post.findMany({
            where: {
                isDeleted: false,
                isVisible: true
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        replies: true,
                        votes: true
                    }
                },
                votes: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit
        });

        const total = await prisma.post.count({
            where: {
                isDeleted: false,
                isVisible: true
            }
        });

        return NextResponse.json({
            posts,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });

    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Error fetching posts' }, { status: 500 });
    }
}

export async function POST(req) {
    // Apply rate limiting - 3 posts per minute
    const rateLimit = applyRateLimit(req, rateLimiters.forumPost);
    if (rateLimit.limited) {
        logSecurityEvent('RATE_LIMIT_FORUM_POST', getSecurityInfo(req));
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

        if (!session) {
            logSecurityEvent('UNAUTHORIZED_POST_ATTEMPT', getSecurityInfo(req));
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const title = formData.get('title');
        const content = formData.get('content');
        const tags = formData.get('tags');
        const files = formData.getAll('files');

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const fileUrls = [];
        if (files && files.length > 0) {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'forum');
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true });
            }

            for (const file of files) {
                // Skip if file is empty or not a file object
                if (file && file.size > 0 && typeof file.arrayBuffer === 'function') {
                    const bytes = await file.arrayBuffer();
                    const buffer = Buffer.from(bytes);

                    // Validate file
                    const validation = await validateUpload(file, buffer, {
                        allowedMimeTypes: ALLOWED_MIME_TYPES,
                        maxSize: 100 * 1024 * 1024
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

                    // Generate secure filename
                    const randomId = Math.random().toString(36).substring(2, 8);
                    const safeOriginalName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ''));
                    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
                    const filename = `${safeOriginalName}_${randomId}.${extension}`;
                    const filepath = path.join(uploadDir, filename);

                    await writeFile(filepath, buffer);
                    fileUrls.push(`/uploads/forum/${filename}`);
                }
            }
        }

        const post = await prisma.post.create({
            data: {
                title,
                content,
                tags: tags || '',
                authorId: session.user.id,
                fileUrls: fileUrls.length > 0 ? JSON.stringify(fileUrls) : null
            }
        });

        return NextResponse.json(post, { status: 201 });

    } catch (error) {
        console.error('Error creating post:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json({ error: 'Error creating post', details: error.message }, { status: 500 });
    }
}
