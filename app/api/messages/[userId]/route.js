import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET conversation with specific user
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await params;
        const userEmail = session.user.email;

        console.log('=== DM Debug Info ===');
        console.log('Requested userId:', userId);
        console.log('Current user email:', userEmail);

        const currentUser = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
        }

        console.log('Current user ID:', currentUser.id);

        // Get the other user's info
        const otherUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                name: true,
                firstName: true,
                lastName: true,
                avatar: true,
                university: true,
                department: true,
                lastSeen: true,
                showOnlineStatus: true
            }
        });

        // Calculate if user is online (active within last 5 minutes)
        const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
        const isOnline = otherUser?.lastSeen
            ? (new Date() - new Date(otherUser.lastSeen)) < ONLINE_THRESHOLD_MS
            : false;

        if (!otherUser) {
            console.log(`Target user with ID ${userId} not found`);
            return NextResponse.json({ error: `Target user not found (ID: ${userId})` }, { status: 404 });
        }

        // Get all messages between these two users
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUser.id, receiverId: userId },
                    { senderId: userId, receiverId: currentUser.id }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                senderId: userId,
                receiverId: currentUser.id,
                read: false
            },
            data: {
                read: true
            }
        });

        // Mark notifications as read for these messages
        // We find notifications of type 'message' for the current user where the sender is the other user
        // Since we don't have a direct link in the notification to the senderId (only messageId), 
        // and we just marked messages as read, we can try to find notifications linked to those messages.
        // However, a simpler approach for now is to mark all 'message' type notifications from this user as read.
        // But the notification model has 'messageId'.

        // Let's find the message IDs we just marked as read (or all messages from this user)
        const unreadMessages = await prisma.message.findMany({
            where: {
                senderId: userId,
                receiverId: currentUser.id
            },
            select: { id: true }
        });

        const messageIds = unreadMessages.map(m => m.id);

        if (messageIds.length > 0) {
            await prisma.notification.updateMany({
                where: {
                    userId: currentUser.id,
                    type: 'message',
                    messageId: {
                        in: messageIds
                    },
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });
        }

        // Build otherUser response with online status
        const otherUserResponse = {
            ...otherUser,
            isOnline: otherUser.showOnlineStatus ? isOnline : false,
            lastSeen: otherUser.showOnlineStatus ? otherUser.lastSeen : null
        };

        return NextResponse.json({ messages, otherUser: otherUserResponse });
    } catch (error) {
        console.error('=== ERROR in messages API ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return NextResponse.json({
            error: 'Failed to fetch conversation',
            details: error.message
        }, { status: 500 });
    }
}
