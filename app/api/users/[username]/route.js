import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            console.log('API: Unauthorized access attempt to profile');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username: rawUsername } = await params;
        const username = decodeURIComponent(rawUsername);
        console.log('API: Fetching user profile for raw:', rawUsername);
        console.log('API: Decoded username:', username);

        // Get user profile
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                name: true,
                firstName: true,
                lastName: true,
                university: true,
                department: true,
                avatar: true,
                coverImage: true,
                coverColor: true,
                createdAt: true,
                profileVisible: true,
                allowMessages: true,
            }
        });

        if (!user) {
            console.log(`API: User not found in DB: "${username}"`);
            // Try case-insensitive search as fallback
            const userCaseInsensitive = await prisma.user.findFirst({
                where: {
                    username: {
                        equals: username,
                        mode: 'insensitive'
                    }
                }
            });

            if (userCaseInsensitive) {
                console.log(`API: Found user with case-insensitive search: "${userCaseInsensitive.username}"`);
                // We could return this user, or just log it for now. 
                // Let's return it to be helpful.
                // We found the user, but we need to return it in the correct structure
                // Re-assign user variable and let the rest of the function handle it
                // But we can't re-assign const 'user'.
                // So we should just return the correct structure here.

                // We need to check privacy for this user too
                const currentUser = await prisma.user.findUnique({
                    where: { email: session.user.email },
                    select: { id: true }
                });

                const isOwnProfile = currentUser && currentUser.id === userCaseInsensitive.id;
                const isProfilePrivate = !userCaseInsensitive.profileVisible && !isOwnProfile;

                // We won't fetch posts/replies for this fallback case to keep it simple for now, 
                // or we could refactor. For now, let's just return the basic structure.
                return NextResponse.json({
                    user: userCaseInsensitive,
                    posts: [],
                    replies: [],
                    isPrivate: isProfilePrivate,
                    note: 'Returned via case-insensitive match'
                });
            }

            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log(`API: User found: ${user.username}`);

        // Get current user to check if viewing own profile
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        const isOwnProfile = currentUser && currentUser.id === user.id;

        // Check privacy settings
        const isProfilePrivate = !user.profileVisible && !isOwnProfile;

        let posts = [];
        let replies = [];

        // Only fetch posts and replies if profile is public OR viewing own profile
        if (!isProfilePrivate) {
            // Get user's forum posts
            const rawPosts = await prisma.post.findMany({
                where: { authorId: user.id },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    tags: true,
                    fileUrls: true,
                    authorId: true,
                    createdAt: true,
                    updatedAt: true,
                    viewCount: true,
                    fakeViewCount: true,
                    fakeVoteCount: true,
                    noteId: true,
                    author: {
                        select: {
                            username: true,
                            name: true,
                            university: true,
                            department: true
                        }
                    },
                    _count: {
                        select: {
                            replies: true,
                            votes: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // Merge fake counts with real counts
            posts = rawPosts.map(post => ({
                ...post,
                viewCount: (post.viewCount || 0) + (post.fakeViewCount || 0),
                _count: {
                    ...post._count,
                    votes: (post._count?.votes || 0) + (post.fakeVoteCount || 0)
                }
            }));

            // Get user's replies
            replies = await prisma.reply.findMany({
                where: { authorId: user.id },
                include: {
                    author: {
                        select: {
                            username: true,
                            name: true,
                            university: true,
                            department: true
                        }
                    },
                    post: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }

        return NextResponse.json({
            user,
            posts,
            replies,
            isPrivate: isProfilePrivate
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
