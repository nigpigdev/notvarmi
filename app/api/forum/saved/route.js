import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch all saved posts for current user
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ savedPosts: [] });
        }

        const savedPosts = await prisma.savedPost.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                post: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatar: true,
                                university: true,
                                department: true
                            }
                        },
                        _count: {
                            select: {
                                replies: true
                            }
                        },
                        votes: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ savedPosts });
    } catch (error) {
        console.error('Error fetching saved posts:', error);
        return NextResponse.json({ error: 'Failed to fetch saved posts' }, { status: 500 });
    }
}
