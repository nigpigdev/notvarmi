import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sanitizeInput, isValidEmail, checkPasswordStrength } from '@/lib/security';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limiter';

export async function POST(req) {
    try {
        // Apply rate limiting
        const rateLimit = applyRateLimit(req, rateLimiters.auth);
        if (rateLimit.limited) {
            return NextResponse.json(rateLimit.response.body, { status: 429 });
        }

        const body = await req.json();
        const email = sanitizeInput(body.email);
        const code = sanitizeInput(body.code);
        const { newPassword } = body; // Don't sanitize password as it might have special chars intended

        if (!email || !isValidEmail(email) || !code || !newPassword) {
            return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
        }

        // Check password strength
        const passwordCheck = checkPasswordStrength(newPassword);
        if (!passwordCheck.isStrong) {
            return NextResponse.json({
                error: 'Şifre yeterince güçlü değil',
                details: passwordCheck.issues
            }, { status: 400 });
        }

        // Find user with this reset code
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user || user.resetCode !== code) {
            return NextResponse.json({ error: 'Geçersiz kod veya e-posta' }, { status: 400 });
        }

        // Check expiry
        if (!user.resetCodeExpiry || new Date() > user.resetCodeExpiry) {
            return NextResponse.json({ error: 'Kodun süresi dolmuş' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user: set new password and clear reset code fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetCode: null,
                resetCodeExpiry: null
            }
        });

        return NextResponse.json({ success: true, message: 'Şifreniz başarıyla güncellendi' });

    } catch (error) {
        console.error('Verify reset error:', error);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu' }, { status: 500 });
    }
}
