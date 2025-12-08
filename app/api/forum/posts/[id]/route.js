import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const globalForPrisma = global;

const prismaClient = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient;

export async function GET(req, { params }) {
    try {
        // Await params for Next.js 15+ compatibility
        const { id } = await params;

        console.log('Fetching post with ID:', id);

        const post = await prismaClient.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        name: true,
                        email: true,
                        avatar: true,
                        username: true,
                        university: true,
                        department: true,
                    },
                },
                replies: {
                    include: {
                        author: {
                            select: {
                                name: true,
                                avatar: true,
                                username: true,
                                university: true,
                                department: true,
                            },
                        },
                        votes: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                votes: true,
            },
        });

        if (!post || !post.isVisible) {
            console.log('Post not found (or hidden) for ID:', id);
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Increment view count
        try {
            const session = await getServerSession(authOptions);

            if (session && session.user) {
                // For logged-in users: unique view tracking
                const userEmail = session.user.email;
                const currentUser = await prismaClient.user.findUnique({
                    where: { email: userEmail },
                    select: { id: true }
                });

                if (currentUser) {
                    const existingView = await prismaClient.postView.findUnique({
                        where: {
                            userId_postId: {
                                userId: currentUser.id,
                                postId: id
                            }
                        }
                    });

                    if (!existingView) {
                        await prismaClient.$transaction([
                            prismaClient.postView.create({
                                data: {
                                    userId: currentUser.id,
                                    postId: id
                                }
                            }),
                            prismaClient.post.update({
                                where: { id },
                                data: { viewCount: { increment: 1 } }
                            })
                        ]);
                    }
                }
            } else {
                // For anonymous users: always increment view count
                await prismaClient.post.update({
                    where: { id },
                    data: { viewCount: { increment: 1 } }
                });
            }
        } catch (updateError) {
            console.error('Failed to update view count:', updateError);
            // Continue to return the post even if view count update fails
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json({ error: 'Error fetching post' }, { status: 500 });
    }
}
