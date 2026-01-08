import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sanitizeObject, isValidEmail, checkPasswordStrength } from '@/lib/security';
import prisma from '@/lib/prisma';

export async function POST(req) {
    try {
        const body = await req.json();
        const { firstName, lastName, username, email, university, department, password } = sanitizeObject(body);

        // Basic presence validation
        if (!firstName || !lastName || !username || !email || !university || !department || !password) {
            return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
        }

        // Email format validation
        if (!isValidEmail(email)) {
            return NextResponse.json({ error: 'Geçersiz e-posta adresi' }, { status: 400 });
        }

        // Password strength validation
        const passwordCheck = checkPasswordStrength(password);
        if (!passwordCheck.isStrong) {
            return NextResponse.json({
                error: 'Şifre yeterince güçlü değil',
                details: passwordCheck.issues
            }, { status: 400 });
        }

        // Check if username or email already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username.toLowerCase() },
                    { email: email.toLowerCase() }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.username === username.toLowerCase()) {
                return NextResponse.json({ error: 'Bu kullanıcı adı zaten kullanılıyor' }, { status: 409 });
            }
            if (existingUser.email === email.toLowerCase()) {
                return NextResponse.json({ error: 'Bu e-posta adresi zaten kayıtlı' }, { status: 409 });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                name: `${firstName} ${lastName}`, // Legacy field
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                university,
                department,
                password: hashedPassword,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                university: true,
                department: true
            }
        });

        return NextResponse.json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            user
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Kayıt sırasında bir hata oluştu' }, { status: 500 });
    }
}
