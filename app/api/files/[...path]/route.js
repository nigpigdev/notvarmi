import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(request, { params }) {
    try {
        const { path: filePath } = await params;

        // Join the path segments
        const fullPath = Array.isArray(filePath) ? filePath.join('/') : filePath;

        // Construct the file path and normalize it
        const publicDir = path.resolve(process.cwd(), 'public');
        const absolutePath = path.resolve(publicDir, fullPath);

        // Security check: ensure the path is within public directory
        if (!absolutePath.startsWith(publicDir)) {
            return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
        }

        // Check if file exists
        if (!existsSync(absolutePath)) {
            console.error('File not found:', absolutePath);
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Read the file
        const fileBuffer = await readFile(absolutePath);

        // Determine content type based on file extension
        const ext = path.extname(absolutePath).toLowerCase();
        const contentTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.zip': 'application/zip',
            '.rar': 'application/x-rar-compressed',
        };

        const contentType = contentTypes[ext] || 'application/octet-stream';

        // Return the file with proper headers
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${path.basename(absolutePath)}"`,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
                'Content-Security-Policy': "default-src 'none'; sandbox",
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('Error serving file:', error);
        return NextResponse.json({
            error: 'Failed to serve file',
            details: error.message
        }, { status: 500 });
    }
}
