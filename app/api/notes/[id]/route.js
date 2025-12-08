import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// PUT update a note
export async function PUT(req, { params }) {
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

        const { id } = await params;
        const body = await req.json();

        // Verify note belongs to user
        const existingNote = await prisma.note.findUnique({
            where: { id }
        });

        if (!existingNote || existingNote.authorId !== user.id) {
            return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
        }

        const note = await prisma.note.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                courseId: body.courseId,
                tags: body.tags,
                isPublic: body.isPublic,
            },
            include: {
                course: true
            }
        });

        // Handle Post synchronization
        const existingPost = await prisma.post.findUnique({
            where: { noteId: id }
        });

        if (body.isPublic) {
            if (existingPost) {
                // Update existing post
                await prisma.post.update({
                    where: { id: existingPost.id },
                    data: {
                        title: body.title,
                        content: body.description,
                        tags: body.tags || 'Ders Notu',
                    }
                });
            } else {
                // Create new post if it doesn't exist
                await prisma.post.create({
                    data: {
                        title: body.title,
                        content: body.description,
                        tags: body.tags || 'Ders Notu',
                        fileUrls: existingNote.fileUrls, // Use existing file URLs
                        authorId: user.id,
                        noteId: id
                    }
                });
            }
        } else if (existingPost) {
            // If made private, delete the post
            await prisma.post.delete({
                where: { id: existingPost.id }
            });
        }

        return NextResponse.json(note);
    } catch (error) {
        console.error('Error updating note:', error);
        return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }
}

// DELETE delete a note
export async function DELETE(req, { params }) {
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

        const { id } = await params;

        // Verify note belongs to user
        const existingNote = await prisma.note.findUnique({
            where: { id }
        });

        if (!existingNote || existingNote.authorId !== user.id) {
            return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
        }

        // Delete linked post first if it exists
        const linkedPost = await prisma.post.findUnique({
            where: { noteId: id }
        });

        if (linkedPost) {
            await prisma.post.delete({
                where: { id: linkedPost.id }
            });
        }

        await prisma.note.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }
}
