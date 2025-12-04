import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isAdmin } from '@/lib/roles';

export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { adminMode } = await request.json();

        if (typeof adminMode !== 'boolean') {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Verify the user is actually an ADMIN in the database
        // We must check the DB because session.user.role might be downgraded
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (!user || !isAdmin(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update the adminMode
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { adminMode: adminMode },
            select: { adminMode: true }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating admin mode:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
