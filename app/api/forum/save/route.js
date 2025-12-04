import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Check if post is saved by current user
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ saved: false });
        }

        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('postId');

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const savedPost = await prisma.savedPost.findUnique({
            where: {
                userId_postId: {
                    userId: session.user.id,
                    postId: postId
                }
            }
        });

        return NextResponse.json({ saved: !!savedPost });
    } catch (error) {
        console.error('Error checking saved post:', error);
        return NextResponse.json({ error: 'Failed to check saved status' }, { status: 500 });
    }
}

// POST - Save a post
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { postId } = await request.json();

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        // Check if post exists
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Check if already saved
        const existingSave = await prisma.savedPost.findUnique({
            where: {
                userId_postId: {
                    userId: session.user.id,
                    postId: postId
                }
            }
        });

        if (existingSave) {
            return NextResponse.json({ message: 'Post already saved', saved: true });
        }

        // Save the post
        await prisma.savedPost.create({
            data: {
                userId: session.user.id,
                postId: postId
            }
        });

        return NextResponse.json({ message: 'Post saved successfully', saved: true });
    } catch (error) {
        console.error('Error saving post:', error);
        return NextResponse.json({ error: 'Failed to save post' }, { status: 500 });
    }
}

// DELETE - Unsave a post
export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const postId = searchParams.get('postId');

        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        await prisma.savedPost.deleteMany({
            where: {
                userId: session.user.id,
                postId: postId
            }
        });

        return NextResponse.json({ message: 'Post unsaved successfully', saved: false });
    } catch (error) {
        console.error('Error unsaving post:', error);
        return NextResponse.json({ error: 'Failed to unsave post' }, { status: 500 });
    }
}
