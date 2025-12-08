import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import PostDetailClient from './PostDetailClient';

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// Server-side function to fetch post data
async function getPost(id) {
    try {
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        name: true,
                        email: true,
                        avatar: true,
                        username: true,
                        university: true,
                        department: true,
                    },
                },
                replies: {
                    include: {
                        author: {
                            select: {
                                name: true,
                                avatar: true,
                                username: true,
                                university: true,
                                department: true,
                            },
                        },
                        votes: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                votes: true,
            },
        });

        if (!post || !post.isVisible) {
            return null;
        }

        return post;
    } catch (error) {
        console.error('Error fetching post for SEO:', error);
        return null;
    }
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }) {
    const { id } = await params;
    const post = await getPost(id);

    if (!post) {
        return {
            title: 'Tartışma Bulunamadı | Notvarmı Topluluk',
            description: 'Aradığınız tartışma bulunamadı.',
        };
    }

    const cleanTitle = post.title;
    const description = post.content.length > 160
        ? post.content.substring(0, 157) + '...'
        : post.content;
    const keywords = post.tags ? post.tags.split(',').map(t => t.trim()) : [];
    const baseUrl = 'https://www.notvarmi.com';

    return {
        title: `${cleanTitle} | Notvarmı Topluluk`,
        description: description,
        keywords: [...keywords, 'üniversite', 'topluluk', 'soru cevap', 'ders notları', 'sınav soruları'],
        openGraph: {
            title: cleanTitle,
            description: description,
            type: 'article',
            url: `${baseUrl}/forum/${post.id}`,
            siteName: 'Notvarmı',
            locale: 'tr_TR',
            publishedTime: new Date(post.createdAt).toISOString(),
            modifiedTime: new Date(post.updatedAt).toISOString(),
            authors: [post.author.name || 'Anonim'],
            tags: keywords,
        },
        twitter: {
            card: 'summary_large_image',
            title: cleanTitle,
            description: description,
        },
        alternates: {
            canonical: `${baseUrl}/forum/${post.id}`,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

// Server component page
export default async function PostPage({ params }) {
    const { id } = await params;
    const post = await getPost(id);

    if (!post) {
        notFound();
    }

    // JSON-LD Structured Data for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        headline: post.title,
        text: post.content,
        datePublished: new Date(post.createdAt).toISOString(),
        dateModified: new Date(post.updatedAt).toISOString(),
        author: {
            '@type': 'Person',
            name: post.author.name || 'Anonim',
            url: post.author.username
                ? `https://www.notvarmi.com/profile/${post.author.username}`
                : undefined,
        },
        publisher: {
            '@type': 'Organization',
            name: 'Notvarmı',
            url: 'https://www.notvarmi.com',
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://www.notvarmi.com/forum/${post.id}`,
        },
        interactionStatistic: [
            {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/ViewAction',
                userInteractionCount: post.viewCount || 0,
            },
            {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/CommentAction',
                userInteractionCount: post.replies.length,
            },
        ],
        commentCount: post.replies.length,
        keywords: post.tags,
        inLanguage: 'tr-TR',
        about: {
            '@type': 'EducationalAudience',
            educationalRole: 'student',
        },
    };

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* SEO-friendly content for search engines */}
            <article style={{ display: 'none' }} aria-hidden="true">
                <h1>{post.title}</h1>
                <p>{post.content}</p>
                <span>Yazar: {post.author.name || 'Anonim'}</span>
                <time dateTime={new Date(post.createdAt).toISOString()}>
                    {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                </time>
            </article>

            {/* Client component for interactive features */}
            <PostDetailClient initialPost={post} postId={id} />
        </>
    );
}
