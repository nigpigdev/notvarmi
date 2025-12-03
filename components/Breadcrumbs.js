'use client';

import Link from 'next/link';
import { generateBreadcrumbSchema } from '@/lib/seo';
import SEOHead from './SEOHead';

/**
 * Breadcrumbs Component
 * Provides visual breadcrumb navigation with structured data
 */
export default function Breadcrumbs({ items }) {
    if (!items || items.length === 0) return null;

    return (
        <>
            <SEOHead structuredData={generateBreadcrumbSchema(items)} />
            <nav
                aria-label="Breadcrumb"
                style={{
                    marginBottom: '1.5rem',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border)',
                }}
            >
                <ol
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '0.5rem',
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                    }}
                >
                    {items.map((item, index) => (
                        <li
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.9rem',
                            }}
                        >
                            {index > 0 && (
                                <span
                                    style={{
                                        color: 'var(--text-secondary)',
                                        userSelect: 'none',
                                    }}
                                >
                                    /
                                </span>
                            )}
                            {index === items.length - 1 ? (
                                <span
                                    style={{
                                        color: 'var(--text)',
                                        fontWeight: '600',
                                    }}
                                    aria-current="page"
                                >
                                    {item.name}
                                </span>
                            ) : (
                                <Link
                                    href={item.url}
                                    style={{
                                        color: 'var(--accent-purple)',
                                        textDecoration: 'none',
                                        transition: 'color 0.2s ease',
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.textDecoration = 'underline')
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.textDecoration = 'none')
                                    }
                                >
                                    {item.name}
                                </Link>
                            )}
                        </li>
                    ))}
                </ol>
            </nav>
        </>
    );
}
