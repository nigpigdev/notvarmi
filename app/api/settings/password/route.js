import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPasswordStrength } from '@/lib/security';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Apply rate limiting
        const rateLimit = applyRateLimit(req, rateLimiters.auth);
        if (rateLimit.limited) {
            return NextResponse.json(rateLimit.response.body, { status: 429 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'All fields required' }, { status: 400 });
        }

        // Password strength validation
        const passwordCheck = checkPasswordStrength(newPassword);
        if (!passwordCheck.isStrong) {
            return NextResponse.json({
                error: 'Şifre yeterince güçlü değil',
                details: passwordCheck.issues
            }, { status: 400 });
        }

        // Get user with current password
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json({ error: 'Error changing password' }, { status: 500 });
    }
}
