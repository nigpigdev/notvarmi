/**
 * SEO Utility Library
 * Provides functions for generating structured data and meta tags
 */

const baseUrl = 'https://www.notvarmi.com';

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Notvarmı',
        url: baseUrl,
        logo: `${baseUrl}/icon-512x512.svg`,
        description: 'Üniversite öğrencileri için not paylaşım ve akademik yardımlaşma platformu',
        sameAs: [
            // Add social media profiles here when available
        ],
    };
}

/**
 * Generate WebSite structured data with search action
 */
export function generateWebSiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Notvarmı',
        url: baseUrl,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${baseUrl}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

/**
 * Generate Article structured data for forum posts
 */
export function generateArticleSchema({ title, content, author, datePublished, dateModified, tags, url }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: content?.substring(0, 200) || '',
        author: {
            '@type': 'Person',
            name: author?.name || 'Anonymous',
            url: author?.username ? `${baseUrl}/profile/${author.username}` : undefined,
        },
        datePublished: datePublished,
        dateModified: dateModified || datePublished,
        publisher: {
            '@type': 'Organization',
            name: 'Notvarmı',
            logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/icon-512x512.svg`,
            },
        },
        keywords: tags?.split(',').map(tag => tag.trim()).join(', ') || '',
        url: url,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': url,
        },
    };
}

/**
 * Generate Course structured data
 */
export function generateCourseSchema({ name, code, instructor, credits, description }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: `${code} - ${name}`,
        courseCode: code,
        description: description || `${name} dersi hakkında notlar ve bilgiler`,
        provider: {
            '@type': 'Organization',
            name: instructor || 'Üniversite',
        },
        educationalCredentialAwarded: credits ? `${credits} Kredi` : undefined,
    };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url ? `${baseUrl}${item.url}` : undefined,
        })),
    };
}

/**
 * Generate meta tags object
 */
export function generateMetaTags({
    title,
    description,
    keywords,
    url,
    image,
    type = 'website',
    author,
    publishedTime,
    modifiedTime,
}) {
    const fullUrl = url?.startsWith('http') ? url : `${baseUrl}${url || ''}`;
    const imageUrl = image?.startsWith('http') ? image : `${baseUrl}${image || '/icon-512x512.svg'}`;

    return {
        title: title || 'Notvarmı - Üniversite Öğrencileri Platformu',
        description: description || 'Üniversite öğrencileri için not paylaşım, ders bilgileri ve akademik yardımlaşma platformu',
        keywords: keywords || 'üniversite notları, ders notları, öğrenci platformu, akademik yardımlaşma, not paylaşımı',
        openGraph: {
            type: type,
            url: fullUrl,
            title: title || 'Notvarmı',
            description: description || 'Üniversite öğrencileri için not paylaşım platformu',
            siteName: 'Notvarmı',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title || 'Notvarmı',
                },
            ],
            locale: 'tr_TR',
            ...(publishedTime && { publishedTime }),
            ...(modifiedTime && { modifiedTime }),
        },
        twitter: {
            card: 'summary_large_image',
            title: title || 'Notvarmı',
            description: description || 'Üniversite öğrencileri için not paylaşım platformu',
            images: [imageUrl],
            creator: author ? `@${author}` : undefined,
        },
        ...(url && { alternates: { canonical: fullUrl } }),
    };
}

/**
 * Generate CollectionPage structured data for forum
 */
export function generateCollectionPageSchema({ name, description, url, numberOfItems }) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: name,
        description: description,
        url: `${baseUrl}${url}`,
        breadcrumb: generateBreadcrumbSchema([
            { name: 'Ana Sayfa', url: '/' },
            { name: name, url: url },
        ]),
        ...(numberOfItems && {
            mainEntity: {
                '@type': 'ItemList',
                numberOfItems: numberOfItems,
            },
        }),
    };
}

/**
 * Generate FAQ structured data
 */
export function generateFAQSchema(questions) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map(q => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: q.answer,
            },
        })),
    };
}

export const baseMetadata = {
    metadataBase: new URL(baseUrl),
    applicationName: 'Notvarmı',
    authors: [{ name: 'Notvarmı Team' }],
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    keywords: ['üniversite', 'notlar', 'ders notları', 'öğrenci platformu', 'akademik', 'yardımlaşma', 'forum'],
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    category: 'education',
};
