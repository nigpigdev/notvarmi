import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPasswords() {
    console.log('Resetting admin passwords...\n');

    const admins = [
        { email: 'poweruser@notvarmi.com', password: 'PowerUser2024!' },
        { email: 'admin1@notvarmi.com', password: 'Admin2024!' },
        { email: 'admin2@notvarmi.com', password: 'Admin2024!' },
        { email: 'admin3@notvarmi.com', password: 'Admin2024!' },
        { email: 'admin4@notvarmi.com', password: 'Admin2024!' },
        { email: 'admin5@notvarmi.com', password: 'Admin2024!' }
    ];

    for (const admin of admins) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);

        try {
            await prisma.user.update({
                where: { email: admin.email },
                data: { password: hashedPassword }
            });
            console.log(`✅ Reset password for ${admin.email}`);
        } catch (error) {
            console.error(`❌ Error resetting ${admin.email}:`, error.message);
        }
    }

    console.log('\n✨ Password reset complete!');
    await prisma.$disconnect();
}

resetAdminPasswords();
