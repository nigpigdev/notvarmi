'use client';

/**
 * SEO Head Component
 * Reusable component for adding structured data to pages
 */
export default function SEOHead({ structuredData }) {
    if (!structuredData) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(structuredData),
            }}
        />
    );
}
