import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { sanitizeInput, isValidEmail } from '@/lib/security';
import { rateLimiters, applyRateLimit } from '@/lib/rate-limiter';
import prisma from '@/lib/prisma';

export async function POST(req) {
    try {
        // Apply rate limiting
        const rateLimit = applyRateLimit(req, rateLimiters.auth);
        if (rateLimit.limited) {
            return NextResponse.json(rateLimit.response.body, { status: 429 });
        }

        const body = await req.json();
        const email = sanitizeInput(body.email);

        if (!email || !isValidEmail(email)) {
            return NextResponse.json({ error: 'Geçersiz e-posta adresi' }, { status: 400 });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // Standard response for security (prevents user enumeration)
        if (!user) {
            // Even if user doesn't exist, we return success to prevent enumeration
            return NextResponse.json({ success: true, message: 'If an account exists for this email, a reset code has been sent.' });
        }

        // Generate 6-digit code
        const resetCode = crypto.randomInt(100000, 999999).toString();
        const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Save to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetCode,
                resetCodeExpiry
            }
        });

        // In production, we don't log the code
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Reset code for ${email}: ${resetCode}`);
        }

        // Send email
        // Note: In production, use environment variables for SMTP config
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        try {
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || '"NotVarmı" <noreply@notvarmi.com>',
                    to: email,
                    subject: 'Şifre Sıfırlama Kodu',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #4F46E5;">Şifre Sıfırlama İsteği</h2>
                            <p>Hesabınız için şifre sıfırlama isteği aldık. Kodunuz:</p>
                            <div style="background-color: #F3F4F6; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1F2937;">${resetCode}</span>
                            </div>
                            <p>Bu kod 15 dakika süreyle geçerlidir.</p>
                            <p style="color: #6B7280; font-size: 14px;">Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
                        </div>
                    `
                });
                console.log('Email sent successfully');
            } else {
                console.warn('SMTP credentials not found. Email not sent, but code logged above.');
            }
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the request if email fails, just log it (in dev)
            // In prod, you might want to return an error
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
