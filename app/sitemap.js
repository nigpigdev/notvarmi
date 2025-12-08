import { PrismaClient } from '@prisma/client';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default async function sitemap() {
    const baseUrl = 'https://www.notvarmi.com';

    // Static pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/register`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/topluluk`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/courses`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/arsiv`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
    ];

    try {
        // Get all visible forum posts
        const posts = await prisma.post.findMany({
            where: {
                isVisible: true,
                isDeleted: false,
            },
            select: {
                id: true,
                updatedAt: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: 1000, // Limit to prevent huge sitemaps
        });

        const postPages = posts.map((post) => ({
            url: `${baseUrl}/topluluk/${post.id}`,
            lastModified: post.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.8,
        }));

        // Get all public user profiles
        const users = await prisma.user.findMany({
            where: {
                profileVisible: true,
                isDeleted: false,
                banned: false,
            },
            select: {
                username: true,
                updatedAt: true,
            },
            take: 500, // Limit to prevent huge sitemaps
        });

        const profilePages = users.map((user) => ({
            url: `${baseUrl}/profile/${user.username}`,
            lastModified: user.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.6,
        }));

        // Combine all pages
        return [...staticPages, ...postPages, ...profilePages];
    } catch (error) {
        console.error('Error generating sitemap:', error);
        // Return at least static pages if database query fails
        return staticPages;
    }
}

