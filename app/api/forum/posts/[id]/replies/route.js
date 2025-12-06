import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { validateUpload, sanitizeFilename } from '@/lib/file-validator';
import { logSecurityEvent, getSecurityInfo } from '@/lib/security';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limiter';

const globalForPrisma = global;

const prismaClient = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient;

// Allowed MIME types for replies (images and documents)
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];

export async function POST(req, { params }) {
    // Apply rate limiting
    const rateLimit = applyRateLimit(req, rateLimiters.forumPost);
    if (rateLimit.limited) {
        logSecurityEvent('RATE_LIMIT_REPLY', getSecurityInfo(req));
        return NextResponse.json(
            rateLimit.response.body,
            { status: rateLimit.response.status, headers: rateLimit.response.headers }
        );
    }

    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            logSecurityEvent('UNAUTHORIZED_REPLY_ATTEMPT', getSecurityInfo(req));
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Await params for Next.js 15+ compatibility
        const { id } = await params;
        const formData = await req.formData();
        const content = formData.get('content');

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Find user by email to get ID
        const user = await prismaClient.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get the post to find the author
        const post = await prismaClient.post.findUnique({
            where: { id },
            select: { authorId: true, title: true }
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Handle file uploads
        const fileUrls = [];
        const files = formData.getAll('files');

        if (files.length > 0) {
            const uploadDir = path.join(process.cwd(), 'public/reply-uploads');
            await mkdir(uploadDir, { recursive: true });

            for (const file of files) {
                if (file && file.size > 0) {
                    const buffer = Buffer.from(await file.arrayBuffer());

                    // Validate file
                    const validation = await validateUpload(file, buffer, {
                        allowedMimeTypes: ALLOWED_MIME_TYPES,
                        maxSize: 50 * 1024 * 1024 // 50MB for replies
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

                    const randomId = Math.random().toString(36).substring(2, 8);
                    const safeOriginalName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ''));
                    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
                    const filename = `${safeOriginalName}_${randomId}.${extension}`;

                    // Check if it's an image
                    if (file.type.startsWith('image/')) {
                        const imagePath = path.join(uploadDir, filename);
                        // Use sharp to optimize images
                        await sharp(buffer)
                            .resize(1200, 1200, {
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .jpeg({ quality: 85 })
                            .toFile(imagePath);
                        fileUrls.push(`/reply-uploads/${filename}`);
                    } else {
                        // For non-image files, save directly
                        const filepath = path.join(uploadDir, filename);
                        await writeFile(filepath, buffer);
                        fileUrls.push(`/reply-uploads/${filename}`);
                    }
                }
            }
        }

        // Create the reply
        const reply = await prismaClient.reply.create({
            data: {
                content,
                fileUrls: fileUrls.length > 0 ? JSON.stringify(fileUrls) : null,
                postId: id,
                authorId: user.id,
            },
            include: {
                author: {
                    select: {
                        name: true,
                        username: true,
                        avatar: true,
                        university: true,
                        department: true,
                    },
                },
            },
        });

        // Create notification for post author (if not replying to own post)
        if (post.authorId !== user.id) {
            await prismaClient.notification.create({
                data: {
                    userId: post.authorId,
                    type: 'reply',
                    postId: id,
                    replyId: reply.id,
                    content: content.substring(0, 150), // Preview of reply
                }
            });
        }

        return NextResponse.json(reply, { status: 201 });
    } catch (error) {
        console.error('Error creating reply:', error);
        return NextResponse.json({ error: 'Error creating reply' }, { status: 500 });
    }
}

