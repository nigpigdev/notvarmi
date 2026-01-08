import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET all conversations (unique users)
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userEmail = session.user.email;
        const currentUser = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get all messages sent or received
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUser.id },
                    { receiverId: currentUser.id }
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
                        avatar: true,
                        showOnlineStatus: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        showOnlineStatus: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Group by unique conversation partners
        const conversationsMap = new Map();
        const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

        // Collect all partner IDs to fetch lastSeen manually
        const partnerIds = new Set();
        messages.forEach(message => {
            const partnerId = message.senderId === currentUser.id
                ? message.receiverId
                : message.senderId;
            partnerIds.add(partnerId);
        });

        // Fetch lastSeen for these users
        let lastSeenMap = new Map();
        if (partnerIds.size > 0) {
            try {
                const rawUsers = await prisma.user.findMany({
                    where: {
                        id: { in: Array.from(partnerIds) }
                    },
                    select: {
                        id: true,
                        lastSeen: true
                    }
                });
                rawUsers.forEach(u => {
                    lastSeenMap.set(u.id, u.lastSeen);
                });
            } catch (e) {
                console.error('Failed to fetch lastSeen:', e);
            }
        }

        messages.forEach(message => {
            const partnerId = message.senderId === currentUser.id
                ? message.receiverId
                : message.senderId;
            const partner = message.senderId === currentUser.id
                ? message.receiver
                : message.sender;

            if (!conversationsMap.has(partnerId)) {
                // Get lastSeen from our manual fetch
                const lastSeen = lastSeenMap.get(partnerId) || null;

                // Calculate if user is online (active within last 5 minutes)
                const isOnline = lastSeen
                    ? (new Date() - new Date(lastSeen)) < ONLINE_THRESHOLD_MS
                    : false;

                conversationsMap.set(partnerId, {
                    userId: partnerId,
                    user: {
                        ...partner,
                        // Only show online status if user has enabled it
                        isOnline: partner.showOnlineStatus ? isOnline : false,
                        lastSeen: partner.showOnlineStatus ? lastSeen : null
                    },
                    lastMessage: message.content,
                    lastMessageTime: message.createdAt,
                    unreadCount: 0
                });
            }

            // Count unread messages
            if (message.receiverId === currentUser.id && !message.read) {
                conversationsMap.get(partnerId).unreadCount++;
            }
        });

        const conversations = Array.from(conversationsMap.values());

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

// POST send a new message
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { receiverId, content } = await request.json();

        if (!receiverId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const userEmail = session.user.email;
        const sender = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!sender) {
            return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
        }

        // Check if receiver allows messages
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
            select: {
                id: true,
                allowMessages: true,
                profileVisible: true
            }
        });

        if (!receiver) {
            return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
        }

        // Block messaging if receiver has disabled messages or profile is private
        if (!receiver.allowMessages || !receiver.profileVisible) {
            return NextResponse.json({
                error: 'Bu kullanıcı mesaj almayı kapatmış'
            }, { status: 403 });
        }

        const message = await prisma.message.create({
            data: {
                content,
                senderId: sender.id,
                receiverId
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
                },
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                    }
                }
            }
        });

        // Create notification for receiver
        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'message',
                messageId: message.id,
                content: content,
                isRead: false
            }
        });

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
