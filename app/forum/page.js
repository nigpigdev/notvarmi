'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import FileBadge from '@/components/FileBadge';

export default function Forum() {
    const router = useRouter();
    const { data: session } = useSession();
    const [questions, setQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [showOnlyNotes, setShowOnlyNotes] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [savedPosts, setSavedPosts] = useState({});
    const [userStats, setUserStats] = useState({ posts: 0, replies: 0, documents: 0, views: 0 });
    const { t } = useLanguage();

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch('/api/forum/posts');
                if (res.ok) {
                    const data = await res.json();
                    setQuestions(data.posts || []);
                }
            } catch (error) {
                console.error('Failed to fetch questions', error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    // Fetch user-specific stats
    useEffect(() => {
        const fetchUserStats = async () => {
            if (!session?.user?.id) return;
            try {
                // Calculate user's posts
                const userPosts = questions.filter(q => q.author?.id === session.user.id);
                const postCount = userPosts.length;
                const documentCount = userPosts.filter(q => q.title.startsWith('(Not Paylaşıldı)')).length;
                const viewCount = userPosts.reduce((acc, q) => acc + (q.viewCount || 0), 0);

                // Fetch user's reply count
                let replyCount = 0;
                try {
                    const res = await fetch('/api/forum/user-stats');
                    if (res.ok) {
                        const data = await res.json();
                        replyCount = data.replyCount || 0;
                    }
                } catch (e) {
                    console.error('Error fetching reply count:', e);
                }

                setUserStats({ posts: postCount, replies: replyCount, documents: documentCount, views: viewCount });
            } catch (error) {
                console.error('Error calculating user stats:', error);
            }
        };
        if (questions.length > 0) {
            fetchUserStats();
        }
    }, [session, questions]);

    useEffect(() => {
        const fetchSavedStatus = async () => {
            if (!session?.user?.id || questions.length === 0) return;
            const savedStatus = {};
            for (const q of questions) {
                try {
                    const res = await fetch(`/api/forum/save?postId=${q.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        savedStatus[q.id] = data.saved;
                    }
                } catch (error) {
                    console.error('Error checking saved status:', error);
                }
            }
            setSavedPosts(savedStatus);
        };
        fetchSavedStatus();
    }, [session, questions]);

    const handleSavePost = async (e, postId) => {
        e.stopPropagation();
        if (!session?.user?.id) return;
        const isSaved = savedPosts[postId];
        try {
            if (isSaved) {
                await fetch(`/api/forum/save?postId=${postId}`, { method: 'DELETE' });
                setSavedPosts(prev => ({ ...prev, [postId]: false }));
            } else {
                await fetch('/api/forum/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postId })
                });
                setSavedPosts(prev => ({ ...prev, [postId]: true }));
            }
        } catch (error) {
            console.error('Error toggling save:', error);
        }
    };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 767);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const showNotesParam = urlParams.get('showNotes');
            if (showNotesParam === 'true') setShowOnlyNotes(true);
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
        { id: 'newest', name: t.forum?.sortNewest || 'En Yeni', icon: '🕒' },
        { id: 'oldest', name: t.forum?.sortOldest || 'En Eski', icon: '📅' },
        { id: 'most_replies', name: t.forum?.sortMostReplies || 'En Çok Yanıt', icon: '🔥' },
        { id: 'most_liked', name: 'En Beğenilen', icon: '👍' },
    ];

    const inputStyle = {
        width: '100%',
        padding: '1rem 1.25rem',
        borderRadius: '14px',
        border: '2px solid transparent',
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: 'var(--text)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--background)'
        }}>
            {/* Background Gradient */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '400px',
                background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.06) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                padding: isMobile ? '1rem' : '2rem 1rem',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Header Section */}
                <header style={{
                    textAlign: 'center',
                    marginBottom: '2rem',
                    padding: '1.5rem 0'
                }}>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        margin: '0 auto 1.25rem',
                        borderRadius: '20px',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        boxShadow: '0 15px 35px rgba(249, 115, 22, 0.25)'
                    }}>
                        💬
                    </div>
                    <h1 style={{
                        fontSize: isMobile ? '1.75rem' : '2.25rem',
                        fontWeight: '800',
                        marginBottom: '0.5rem',
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{t.forum?.title || 'Tartışma Forumu'}</h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1rem',
                        maxWidth: '450px',
                        margin: '0 auto 1.5rem'
                    }}>
                        {t.forum?.subtitle || 'Sorular sor, notlar paylaş, birlikte öğren'}
                    </p>

                    {session && (
                        <Link href="/forum/create" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '1rem 2rem',
                            background: 'var(--primary-gradient)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '14px',
                            fontWeight: '700',
                            fontSize: '1rem',
                            boxShadow: '0 8px 25px rgba(249, 115, 22, 0.35)',
                            transition: 'all 0.3s ease'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 35px rgba(249, 115, 22, 0.45)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.35)';
                            }}>
                            ✨ {t.forum?.newPost || 'Yeni Gönderi'}
                        </Link>
                    )}
                </header>

                {/* Stats Bar - User's Forum Activity */}
                {session && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            padding: '1rem',
                            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1))',
                            borderRadius: '14px',
                            border: '1px solid rgba(249, 115, 22, 0.2)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f97316' }}>
                                {userStats.posts}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gönderi</div>
                        </div>
                        <div style={{
                            padding: '1rem',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))',
                            borderRadius: '14px',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                                {userStats.replies}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Yanıt</div>
                        </div>
                        <div style={{
                            padding: '1rem',
                            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(13, 148, 136, 0.1))',
                            borderRadius: '14px',
                            border: '1px solid rgba(20, 184, 166, 0.2)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#14b8a6' }}>
                                {userStats.documents}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Doküman</div>
                        </div>
                        <div style={{
                            padding: '1rem',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
                            borderRadius: '14px',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                                {userStats.views}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Görüntülenme</div>
                        </div>
                    </div>
                )}

                {/* Search & Filter Bar */}
                <div style={{
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '18px',
                    padding: isMobile ? '1rem' : '1.25rem',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        flexDirection: isMobile ? 'column' : 'row'
                    }}>
                        <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
                            <input
                                type="text"
                                placeholder={t.forum?.searchPlaceholder || 'Gönderi ara...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Forumlarda ara"
                                style={inputStyle}
                            />
                        </div>
                        <button
                            onClick={() => setShowOnlyNotes(!showOnlyNotes)}
                            aria-pressed={showOnlyNotes}
                            style={{
                                padding: '1rem 1.5rem',
                                borderRadius: '14px',
                                border: showOnlyNotes ? '2px solid #f97316' : '2px solid transparent',
                                background: showOnlyNotes ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                                color: showOnlyNotes ? 'white' : 'var(--text)',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                whiteSpace: 'nowrap',
                                boxShadow: showOnlyNotes ? '0 8px 20px rgba(249, 115, 22, 0.3)' : 'none',
                                width: isMobile ? '100%' : 'auto',
                                justifyContent: 'center'
                            }}
                        >
                            📄 Sadece Dokümanlar
                        </button>
                    </div>
                </div>

                {/* Sort Options */}
                <nav aria-label="Sıralama seçenekleri" style={{
                    display: 'flex',
                    gap: '0.6rem',
                    flexWrap: 'wrap',
                    marginBottom: '2rem',
                    justifyContent: isMobile ? 'center' : 'flex-start'
                }}>
                    {sortOptions.map(option => (
                        <button
                            key={option.id}
                            onClick={() => setSortBy(option.id)}
                            aria-pressed={sortBy === option.id}
                            style={{
                                padding: '0.6rem 1.1rem',
                                borderRadius: '12px',
                                border: sortBy === option.id ? '2px solid #f97316' : '2px solid transparent',
                                background: sortBy === option.id ? 'var(--primary-gradient)' : 'var(--secondary)',
                                color: sortBy === option.id ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontWeight: sortBy === option.id ? '600' : '500',
                                fontSize: '0.85rem',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                boxShadow: sortBy === option.id ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none'
                            }}
                        >
                            <span>{option.icon}</span>
                            <span>{option.name}</span>
                        </button>
                    ))}
                </nav>

                {/* Posts List */}
                <section aria-label="Forum gönderileri">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                border: '4px solid var(--border)',
                                borderTop: '4px solid #f97316',
                                borderRadius: '50%',
                                margin: '0 auto 1rem',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <p style={{ color: 'var(--text-secondary)' }}>{t.forum?.loading || 'Yükleniyor...'}</p>
                            <style jsx>{`
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    ) : sortedQuestions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {sortedQuestions.map(q => (
                                <article
                                    key={q.id}
                                    onClick={() => router.push(`/forum/${q.id}`)}
                                    style={{
                                        backgroundColor: 'var(--secondary)',
                                        borderRadius: '18px',
                                        padding: isMobile ? '1.25rem' : '1.5rem',
                                        border: '1px solid var(--border)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
                                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                    }}
                                >
                                    {/* Author Info */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{
                                            width: isMobile ? '36px' : '42px',
                                            height: isMobile ? '36px' : '42px',
                                            borderRadius: '12px',
                                            background: 'var(--primary-gradient)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            color: 'white',
                                            fontWeight: '700',
                                            overflow: 'hidden',
                                            flexShrink: 0
                                        }}>
                                            {q.author.avatar ? (
                                                <img src={q.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                q.author.name ? q.author.name[0].toUpperCase() : '?'
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                flexWrap: 'wrap'
                                            }}>
                                                <span style={{
                                                    fontWeight: '600',
                                                    color: 'var(--text)',
                                                    fontSize: isMobile ? '0.9rem' : '0.95rem'
                                                }}>
                                                    {q.author.name || 'Anonim'}
                                                </span>
                                                {q.author.username && (
                                                    <Link
                                                        href={`/profile/${q.author.username}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{
                                                            color: '#f97316',
                                                            fontSize: '0.8rem',
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        @{q.author.username}
                                                    </Link>
                                                )}
                                            </div>
                                            {(q.author.university || q.author.department) && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    marginTop: '0.15rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {q.author.university}{q.author.university && q.author.department && ' • '}{q.author.department}
                                                </div>
                                            )}
                                        </div>
                                        <time style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            flexShrink: 0
                                        }} dateTime={q.createdAt}>
                                            {new Date(q.createdAt).toLocaleDateString('tr-TR')}
                                        </time>
                                    </div>

                                    {/* Title & Badge */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        flexWrap: 'wrap',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <h2 style={{
                                            fontSize: isMobile ? '1.05rem' : '1.15rem',
                                            fontWeight: '700',
                                            color: 'var(--text)',
                                            lineHeight: '1.4',
                                            margin: 0,
                                            flex: 1
                                        }}>
                                            {q.title.replace('(Not Paylaşıldı) ', '')}
                                        </h2>
                                        {q.title.startsWith('(Not Paylaşıldı)') && (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                padding: '0.3rem 0.7rem',
                                                borderRadius: '8px',
                                                background: 'var(--primary-gradient)',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0
                                            }}>
                                                📚 Not
                                            </span>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                                        lineHeight: '1.6',
                                        marginBottom: '1rem',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {q.content?.substring(0, 150)}{q.content?.length > 150 ? '...' : ''}
                                    </p>

                                    {/* Tags */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.4rem',
                                        marginBottom: '1rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        {q.tags.split(',').slice(0, isMobile ? 3 : 5).map((tag, idx) => (
                                            <span key={tag} style={{
                                                fontSize: '0.75rem',
                                                padding: '0.25rem 0.7rem',
                                                borderRadius: '8px',
                                                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                                color: '#f97316',
                                                fontWeight: '500',
                                                border: '1px solid rgba(249, 115, 22, 0.2)'
                                            }}>
                                                #{tag.trim()}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Footer: Files & Stats */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        paddingTop: '1rem',
                                        borderTop: '1px solid var(--border)',
                                        gap: '0.75rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        {/* Files */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {q.fileUrls && (() => {
                                                try {
                                                    const urls = JSON.parse(q.fileUrls);
                                                    if (urls.length > 0) {
                                                        return (
                                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                {urls.slice(0, isMobile ? 1 : 2).map((url, index) => (
                                                                    <FileBadge key={index} url={url} />
                                                                ))}
                                                                {urls.length > (isMobile ? 1 : 2) && (
                                                                    <span style={{
                                                                        fontSize: '0.75rem',
                                                                        color: 'var(--text-secondary)',
                                                                        padding: '0.25rem 0.5rem'
                                                                    }}>
                                                                        +{urls.length - (isMobile ? 1 : 2)} dosya
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                } catch (e) { return null; }
                                            })()}
                                        </div>

                                        {/* Stats */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '0.4rem',
                                            flexWrap: 'wrap',
                                            justifyContent: 'flex-end'
                                        }}>
                                            {/* Views */}
                                            <span style={{
                                                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                                                color: 'var(--text-secondary)',
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '10px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                👁️ {q.viewCount || 0}
                                            </span>

                                            {/* Likes */}
                                            <span style={{
                                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                color: '#16a34a',
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '10px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                👍 {q.votes?.filter(v => v.type === 'LIKE').length || 0}
                                            </span>

                                            {/* Replies */}
                                            <span style={{
                                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                                color: '#8b5cf6',
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '10px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                💬 {q._count?.replies || 0}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '20px',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 1.5rem',
                                borderRadius: '20px',
                                background: 'rgba(249, 115, 22, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.5rem'
                            }}>🔍</div>
                            <h3 style={{
                                color: 'var(--text)',
                                marginBottom: '0.5rem',
                                fontSize: '1.25rem'
                            }}>{t.forum?.noResults || 'Gönderi bulunamadı'}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {t.forum?.noResultsDesc || 'Farklı anahtar kelimelerle tekrar deneyin'}
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
