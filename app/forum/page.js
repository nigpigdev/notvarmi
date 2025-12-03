'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import FileBadge from '@/components/FileBadge';

export default function Forum() {
    const router = useRouter();
    const [questions, setQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [showOnlyNotes, setShowOnlyNotes] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch('/api/forum/posts');
                if (res.ok) {
                    const data = await res.json();
                    setQuestions(data);
                }
            } catch (error) {
                console.error('Failed to fetch questions', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 767);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Check if showNotes parameter is in URL
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const showNotesParam = urlParams.get('showNotes');
            if (showNotesParam === 'true') {
                setShowOnlyNotes(true);
            }
        }
    }, []);

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.tags.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesNoteFilter = !showOnlyNotes || q.title.startsWith('(Not Paylaşıldı)');
        return matchesSearch && matchesNoteFilter;
    });

    const sortedQuestions = [...filteredQuestions].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'most_replies') return b._count.replies - a._count.replies;
        if (sortBy === 'most_liked') {
            const aLikes = a.votes?.filter(v => v.type === 'LIKE').length || 0;
            const bLikes = b.votes?.filter(v => v.type === 'LIKE').length || 0;
            return bLikes - aLikes;
        }
        return 0;
    });

    const sortOptions = [
        { id: 'newest', name: t.forum.sortNewest, icon: '🕒', color: 'var(--accent-blue)' },
        { id: 'oldest', name: t.forum.sortOldest, icon: '📅', color: 'var(--accent-purple)' },
        { id: 'most_replies', name: t.forum.sortMostReplies, icon: '🔥', color: 'var(--accent-amber)' },
        { id: 'most_liked', name: 'En Çok Beğenilen', icon: '👍', color: 'var(--accent-teal)' },
    ];

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '1rem' : '2rem 1rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
            }}>
                <div style={{ width: isMobile ? '100%' : 'auto' }}>
                    <h1 style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: '0.5rem', color: 'var(--text)' }}>{t.forum.title}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{t.forum.subtitle}</p>
                </div>
                <Link href="/forum/create" style={{
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(236, 72, 153, 0.5)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #db2777 0%, #ec4899 50%, #f472b6 100%)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(236, 72, 153, 0.4)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)';
                    }}>
                    <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>💬</span>
                    {t.forum.newPost}
                </Link>
            </div>

            {/* Search and Filter */}
            <div style={{
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.8rem',
                alignItems: 'stretch',
                flexDirection: isMobile ? 'column' : 'row'
            }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)',
                        pointerEvents: 'none'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={t.forum.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--secondary)',
                            color: 'var(--text)',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                    />
                </div>

                {/* Note Filter Button */}
                <button
                    onClick={() => setShowOnlyNotes(!showOnlyNotes)}
                    style={{
                        padding: isMobile ? '1rem' : '0 1.5rem',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        border: showOnlyNotes
                            ? '1px solid var(--accent-purple)'
                            : '1px solid var(--border)',
                        background: showOnlyNotes
                            ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
                            : 'var(--secondary)',
                        color: showOnlyNotes
                            ? 'white'
                            : 'var(--text)',
                        cursor: 'pointer',
                        fontWeight: showOnlyNotes ? '600' : '400',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap',
                        boxShadow: showOnlyNotes ? '0 4px 12px rgba(139, 92, 246, 0.4)' : '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                >
                    <span style={{ fontSize: '1rem' }}>📚</span>
                    <span>Sadece Notlar</span>
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {/* Sort Options */}
                {sortOptions.map(option => (
                    <button
                        key={option.id}
                        onClick={() => setSortBy(option.id)}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '20px',
                            border: sortBy === option.id
                                ? `1px solid ${option.color}`
                                : '1px solid var(--border)',
                            backgroundColor: sortBy === option.id
                                ? option.color
                                : 'var(--secondary)',
                            color: sortBy === option.id
                                ? 'white'
                                : 'var(--text)',
                            cursor: 'pointer',
                            fontWeight: sortBy === option.id ? '600' : '400',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap',
                            boxShadow: sortBy === option.id ? `0 4px 12px ${option.color}33` : 'none'
                        }}
                    >
                        <span style={{ fontSize: '1rem' }}>{option.icon}</span>
                        <span>{option.name}</span>
                    </button>
                ))}
            </div>

            {/* Posts List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid var(--border)',
                            borderTop: '4px solid var(--primary)',
                            borderRadius: '50%',
                            margin: '0 auto 1rem',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p>{t.forum.loading}</p>
                        <style jsx>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : sortedQuestions.length > 0 ? (
                    sortedQuestions.map(q => (
                        <div key={q.id}
                            onClick={() => router.push(`/forum/${q.id}`)}
                            style={{
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.querySelector('.card-shadow').style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.querySelector('.card-shadow').style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                            }}
                        >
                            <div className="card-shadow">
                                <Card>
                                    <div>
                                        {/* 1. Profile info at top */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.2rem',
                                                color: 'var(--text)',
                                                overflow: 'hidden',
                                                border: '1px solid var(--border)',
                                                flexShrink: 0
                                            }}>
                                                {q.author.avatar ? (
                                                    <img src={q.author.avatar} alt={q.author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    q.author.name ? q.author.name[0].toUpperCase() : '?'
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                                                    <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '1rem' }}>{q.author.name || 'Unknown'}</span>
                                                    {q.author.username && (
                                                        <Link
                                                            href={`/profile/${q.author.username}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                color: 'var(--accent-purple)',
                                                                fontSize: '0.85rem',
                                                                textDecoration: 'none',
                                                                transition: 'color 0.2s ease'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                                                            @{q.author.username}
                                                        </Link>
                                                    )}
                                                </div>
                                                {(q.author.university || q.author.department) && (
                                                    <div style={{
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-secondary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        opacity: 0.9
                                                    }}>
                                                        {q.author.university && (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                maxWidth: '150px',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }} title={q.author.university}>
                                                                {q.author.university}
                                                            </span>
                                                        )}
                                                        {q.author.university && q.author.department && <span style={{ opacity: 0.5 }}>•</span>}
                                                        {q.author.department && (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                maxWidth: '150px',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }} title={q.author.department}>
                                                                {q.author.department}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {new Date(q.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* 2. Title with Auto-shared Badge */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                            <h3 style={{
                                                fontSize: '1.25rem',
                                                fontWeight: '700',
                                                color: 'var(--text)',
                                                lineHeight: '1.4',
                                                margin: 0
                                            }}>
                                                {q.title.replace('(Not Paylaşıldı) ', '')}
                                            </h3>
                                            {q.title.startsWith('(Not Paylaşıldı)') && (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    padding: '0.35rem 0.8rem',
                                                    borderRadius: '8px',
                                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                                    color: 'white',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    📚 Not Paylaşıldı
                                                </span>
                                            )}
                                        </div>

                                        {/* 3. Content */}
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.6',
                                            marginBottom: '1rem'
                                        }}>
                                            {q.content?.substring(0, 150)}{q.content?.length > 150 ? '...' : ''}
                                        </p>

                                        {/* 4. Tags */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                            {q.tags.split(',').map((tag, idx) => {
                                                const colors = [
                                                    { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: 'var(--accent-blue)' },
                                                    { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: 'var(--accent-purple)' },
                                                    { bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.3)', text: 'var(--accent-teal)' },
                                                    { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: 'var(--accent-amber)' },
                                                    { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)', text: 'var(--accent-indigo)' },
                                                ];
                                                const colorScheme = colors[idx % colors.length];
                                                return (
                                                    <span key={tag} style={{
                                                        fontSize: '0.8rem',
                                                        padding: '0.3rem 0.9rem',
                                                        borderRadius: '20px',
                                                        backgroundColor: colorScheme.bg,
                                                        color: colorScheme.text,
                                                        fontWeight: '500',
                                                        border: `1px solid ${colorScheme.border}`
                                                    }}>
                                                        #{tag.trim()}
                                                    </span>
                                                );
                                            })}
                                        </div>

                                        {/* 5. Files and Replies at bottom */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            paddingTop: '1rem',
                                            borderTop: '1px solid var(--border)',
                                            gap: '1rem'
                                        }}>
                                            {/* Left: Files */}
                                            <div style={{ flex: 1 }}>
                                                {q.fileUrls && (() => {
                                                    try {
                                                        const urls = JSON.parse(q.fileUrls);
                                                        if (urls.length > 0) {
                                                            return (
                                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                    {urls.map((url, index) => (
                                                                        <FileBadge key={index} url={url} />
                                                                    ))}
                                                                </div>
                                                            );
                                                        }
                                                    } catch (e) { return null; }
                                                })()}
                                            </div>

                                            {/* Right: Stats (Replies, Likes, Dislikes, Views) */}
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                                                {/* Views */}
                                                <span style={{
                                                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                                                    color: 'var(--text-secondary)',
                                                    padding: '0.3rem 0.8rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    border: '1px solid rgba(107, 114, 128, 0.2)'
                                                }} title="Görüntülenme">
                                                    👁️ {q.viewCount || 0}
                                                </span>

                                                {/* Likes */}
                                                <span style={{
                                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                    color: '#16a34a',
                                                    padding: '0.3rem 0.8rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    border: '1px solid rgba(34, 197, 94, 0.2)'
                                                }} title="Beğeni">
                                                    👍 {q.votes?.filter(v => v.type === 'LIKE').length || 0}
                                                </span>

                                                {/* Dislikes */}
                                                <span style={{
                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#dc2626',
                                                    padding: '0.3rem 0.8rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                                }} title="Beğenmeme">
                                                    👎 {q.votes?.filter(v => v.type === 'DISLIKE').length || 0}
                                                </span>

                                                {/* Replies */}
                                                <span style={{
                                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                    color: 'var(--accent-indigo)',
                                                    padding: '0.3rem 0.8rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    border: '1px solid rgba(99, 102, 241, 0.2)'
                                                }} title="Yanıt">
                                                    💬 {q._count.replies}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                        <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{t.forum.noResults}</h3>
                        <p>{t.forum.noResultsDesc}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
