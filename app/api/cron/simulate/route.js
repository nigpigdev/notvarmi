import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
    try {
        const body = await req.json();
        const { activeUsers } = body;

        // Validation
        if (typeof activeUsers !== 'number' || activeUsers < 0) {
            return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
        }

        // Fetch posts to simulate activity on (only posts from last 5 hours)
        const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
        const posts = await prisma.post.findMany({
            where: {
                isDeleted: false,
                isVisible: true,
                createdAt: {
                    gte: fiveHoursAgo
                }
            },
            select: { id: true, createdAt: true, viewCount: true },
            take: 30,
            orderBy: { createdAt: 'desc' }
        });

        if (posts.length === 0) {
            return NextResponse.json({ success: true, message: 'No posts to update' });
        }

        // Reduced probability based on active users to lower bot impact
        // activeUsers = 60 -> viewProb = 0.2, voteProb = 0.04
        const viewProbability = Math.min(activeUsers / 300, 0.3);
        const voteProbability = Math.min(activeUsers / 1500, 0.06);

        const updates = [];

        for (const post of posts) {
            // Calculate age-based weight (newer posts get more activity)
            const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
            const ageMultiplier = ageHours < 24 ? 1.5 : ageHours < 72 ? 1.2 : ageHours < 168 ? 1.0 : 0.6;

            // Add views
            if (Math.random() < viewProbability * ageMultiplier) {
                const viewIncrement = Math.floor(Math.random() * 4) + 1; // 1-4 views
                updates.push(
                    prisma.post.update({
                        where: { id: post.id },
                        data: { fakeViewCount: { increment: viewIncrement } }
                    })
                );
            }

            // Add votes/likes
            if (Math.random() < voteProbability * ageMultiplier) {
                updates.push(
                    prisma.post.update({
                        where: { id: post.id },
                        data: { fakeVoteCount: { increment: 1 } }
                    })
                );
            }
        }

        if (updates.length > 0) {
            await prisma.$transaction(updates);
        }

        return NextResponse.json({
            success: true,
            updated: updates.length,
            postsChecked: posts.length,
            activeUsers
        });

    } catch (error) {
        console.error('Simulation error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
