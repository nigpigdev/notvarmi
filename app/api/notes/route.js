import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { validateUpload, sanitizeFilename } from '@/lib/file-validator';
import { logSecurityEvent, getSecurityInfo } from '@/lib/security';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limiter';

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Allowed MIME types for notes
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

// GET all notes
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');
        const search = searchParams.get('search');

        const where = {
            OR: [
                { authorId: user.id },
                { isPublic: true }
            ]
        };

        if (courseId) {
            where.courseId = courseId;
        }

        if (search) {
            where.AND = {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { tags: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        const notes = await prisma.note.findMany({
            where,
            include: {
                course: true,
                author: {
                    select: {
                        name: true,
                        username: true,
                        avatar: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

// POST create a new note
export async function POST(req) {
    // Apply rate limiting
    const rateLimit = applyRateLimit(req, rateLimiters.upload);
    if (rateLimit.limited) {
        logSecurityEvent('RATE_LIMIT_NOTES', getSecurityInfo(req));
        return NextResponse.json(
            rateLimit.response.body,
            { status: rateLimit.response.status, headers: rateLimit.response.headers }
        );
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            logSecurityEvent('UNAUTHORIZED_NOTE_UPLOAD', getSecurityInfo(req));
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const formData = await req.formData();
        const title = formData.get('title');
        const description = formData.get('description');
        const courseId = formData.get('courseId');
        const tags = formData.get('tags');
        const isPublic = formData.get('isPublic') === 'true';
        const files = formData.getAll('files');

        if (!title || !description || !courseId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Handle file uploads with validation
        const fileUrls = [];
        for (const file of files) {
            if (file instanceof File && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());

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

                const randomId = Math.random().toString(36).substring(2, 8);
                const safeOriginalName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ''));
                const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
                const filename = `${safeOriginalName}_${randomId}.${extension}`;
                const filepath = path.join(uploadDir, filename);

                await writeFile(filepath, buffer);
                fileUrls.push(`/uploads/${filename}`);
            }
        }

        const note = await prisma.note.create({
            data: {
                title,
                description,
                courseId,
                tags: tags || '',
                isPublic,
                fileUrls: JSON.stringify(fileUrls),
                authorId: user.id
            },
            include: {
                course: true
            }
        });

        // If public, create a forum post
        if (isPublic) {
            await prisma.post.create({
                data: {
                    title: title,
                    content: description,
                    tags: tags || 'Ders Notu',
                    fileUrls: JSON.stringify(fileUrls),
                    authorId: user.id,
                    noteId: note.id
                }
            });
        }

        return NextResponse.json(note, { status: 201 });

    } catch (error) {
        console.error('Error creating note:', error);
        return NextResponse.json({
            error: 'Failed to create note',
            details: error.message
        }, { status: 500 });
    }
}

