'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import FilePreview from '@/components/FilePreview';
import VoteButtons from '@/components/VoteButtons';
import ReportModal from '@/components/ReportModal';
import ShareButton from '@/components/ShareButton';
import TimeAgo from '@/components/TimeAgo';
import readingTime from 'reading-time';
import { toast } from 'react-hot-toast';

export default function PostDetailClient({ initialPost, postId }) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [post, setPost] = useState(initialPost);
    const [loading, setLoading] = useState(!initialPost);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [replyFiles, setReplyFiles] = useState([]);
    const [reportModal, setReportModal] = useState({ isOpen: false, type: null, id: null });
    const [isSaved, setIsSaved] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const fileInputRef = useRef(null);

    // Calculate reading time
    const stats = post?.content ? readingTime(post.content) : { text: '1 dk okuma' };
    const readTime = stats.text.replace('min read', 'dk okuma').replace('less than a minute read', '1 dk okuma');

    // Check mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Check if post is saved
    useEffect(() => {
        const checkSavedStatus = async () => {
            if (!session?.user?.id || !postId) return;
            try {
                const res = await fetch(`/api/forum/save?postId=${postId}`);
                if (res.ok) {
                    const data = await res.json();
                    setIsSaved(data.saved);
                }
            } catch (error) {
                console.error('Error checking saved status:', error);
            }
        };
        checkSavedStatus();
    }, [session, postId]);

    // Handle save/unsave
    const handleSavePost = async () => {
        if (!session?.user?.id) return;
        try {
            if (isSaved) {
                await fetch(`/api/forum/save?postId=${postId}`, { method: 'DELETE' });
                setIsSaved(false);
                toast.success('Gönderi kaydedilenlerden kaldırıldı');
            } else {
                await fetch('/api/forum/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postId })
                });
                setIsSaved(true);
                toast.success('Gönderi kaydedildi');
            }
        } catch (error) {
            console.error('Error toggling save:', error);
            toast.error('Bir hata oluştu');
        }
    };

    useEffect(() => {
        if (!post && postId) {
            const fetchPost = async () => {
                try {
                    const res = await fetch(`/api/forum/posts/${postId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setPost(data);
                    }
                } catch (error) {
                    console.error('Failed to fetch post', error);
                    toast.error('Tartışma yüklenirken hata oluştu');
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [postId, post]);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmittingReply(true);
        try {
            const formData = new FormData();
            formData.append('content', replyContent);
            replyFiles.forEach((file) => formData.append('files', file));

            const res = await fetch(`/api/forum/posts/${postId}/replies`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const newReply = await res.json();
                setPost(prev => ({ ...prev, replies: [...prev.replies, newReply] }));
                setReplyContent('');
                setReplyFiles([]);
                toast.success('Yanıtın gönderildi!');
            } else {
                toast.error('Yanıt gönderilemedi');
            }
        } catch (error) {
            console.error('Error submitting reply:', error);
            toast.error('Bir hata oluştu');
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setReplyFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setReplyFiles(prev => prev.filter((_, i) => i !== index));
    };

    const openReportModal = (type, id) => {
        setReportModal({ isOpen: true, type, id });
    };

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

    const actionButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: 'var(--text-secondary)'
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--background)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid var(--border)',
                        borderTop: '4px solid #f97316',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Yükleniyor...</p>
                    <style jsx>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--background)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                    <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Tartışma bulunamadı</h2>
                    <Link href="/topluluk" style={{ color: '#f97316' }}>Topluluğa dön →</Link>
                </div>
            </div>
        );
    }

    // Structured data for SEO
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        headline: post.title,
        text: post.content,
        datePublished: new Date(post.createdAt).toISOString(),
        author: { '@type': 'Person', name: post.author.name },
        commentCount: post.replies.length,
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

            {/* Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

            <ReportModal
                isOpen={reportModal.isOpen}
                onClose={() => setReportModal({ isOpen: false, type: null, id: null })}
                type={reportModal.type}
                id={reportModal.id}
            />

            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                padding: isMobile ? '1rem' : '2rem 1rem',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Back Button */}
                <Link href="/forum" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    padding: '0.75rem 1.25rem',
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#f97316';
                        e.currentTarget.style.color = '#f97316';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text)';
                    }}>
                    ← Topluluğa Dön
                </Link>

                {/* Main Post Card */}
                <article style={{
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '20px',
                    padding: isMobile ? '1.5rem' : '2rem',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    marginBottom: '2rem'
                }}>
                    {/* Header: Tags + Action Buttons */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        {/* Tags */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {post.tags.split(',').map((tag, idx) => (
                                <span key={tag} style={{
                                    fontSize: '0.8rem',
                                    padding: '0.4rem 1rem',
                                    borderRadius: '20px',
                                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                    color: '#f97316',
                                    fontWeight: '500',
                                    border: '1px solid rgba(249, 115, 22, 0.2)'
                                }}>
                                    #{tag.trim()}
                                </span>
                            ))}
                            {post.noteId && (
                                <span style={{
                                    padding: '0.4rem 1rem',
                                    borderRadius: '20px',
                                    background: 'var(--primary-gradient)',
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    fontWeight: '600'
                                }}>
                                    📁 Arşiv
                                </span>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                        }}>
                            {session && (
                                <>
                                    <VoteButtons type="post" id={post.id} initialVotes={post.votes || []} />

                                    <ShareButton
                                        title={post.title}
                                        text={`Notvarmı'da bu tartışmaya bak: ${post.title}`}
                                    />

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSavePost}
                                        title={isSaved ? 'Kaydedildi' : 'Kaydet'}
                                        style={{
                                            ...actionButtonStyle,
                                            backgroundColor: isSaved ? 'rgba(249, 115, 22, 0.15)' : 'var(--secondary)',
                                            borderColor: isSaved ? 'rgba(249, 115, 22, 0.3)' : 'var(--border)',
                                            color: isSaved ? '#f97316' : 'var(--text-secondary)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.15)';
                                            e.currentTarget.style.borderColor = '#f97316';
                                            e.currentTarget.style.color = '#f97316';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = isSaved ? 'rgba(249, 115, 22, 0.15)' : 'var(--secondary)';
                                            e.currentTarget.style.borderColor = isSaved ? 'rgba(249, 115, 22, 0.3)' : 'var(--border)';
                                            e.currentTarget.style.color = isSaved ? '#f97316' : 'var(--text-secondary)';
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? '#f97316' : 'none'} stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                    </button>

                                    {/* Report Button */}
                                    <button
                                        onClick={() => openReportModal('post', post.id)}
                                        title="Raporla"
                                        style={actionButtonStyle}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                            e.currentTarget.style.borderColor = '#ef4444';
                                            e.currentTarget.style.color = '#ef4444';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--secondary)';
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                            <line x1="4" y1="22" x2="4" y2="15"></line>
                                        </svg>
                                    </button>
                                </>
                            )}
                            {!session && (
                                <ShareButton
                                    title={post.title}
                                    text={`Notvarmı'da bu tartışmaya bak: ${post.title}`}
                                />
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h1 style={{
                        fontSize: isMobile ? '1.5rem' : '2rem',
                        fontWeight: '800',
                        color: 'var(--text)',
                        lineHeight: 1.3,
                        marginBottom: '1.5rem'
                    }}>
                        {post.title}
                    </h1>

                    {/* Author Info */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: 'var(--background)',
                        borderRadius: '14px',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '14px',
                            background: 'var(--primary-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            color: 'white',
                            fontWeight: '700',
                            overflow: 'hidden',
                            flexShrink: 0
                        }}>
                            {post.author.avatar ? (
                                <img src={post.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                post.author.name ? post.author.name[0].toUpperCase() : '?'
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1rem' }}>
                                    {post.author.name || 'Anonim'}
                                </span>
                                {post.author.username && (
                                    <Link href={`/profile/${post.author.username}`} style={{ color: '#f97316', fontSize: '0.9rem', textDecoration: 'none' }}>
                                        @{post.author.username}
                                    </Link>
                                )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {(post.author.university || post.author.department) && (
                                    <span>{post.author.university}{post.author.university && post.author.department && ' • '}{post.author.department}</span>
                                )}
                                <span>• <TimeAgo date={post.createdAt} /></span>
                                <span>• {readTime}</span>
                                <span>• 👁️ {post.viewCount || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{
                        fontSize: '1.05rem',
                        lineHeight: 1.8,
                        color: 'var(--text)',
                        whiteSpace: 'pre-wrap',
                        marginBottom: '1.5rem'
                    }}>
                        {post.content}
                    </div>

                    {/* Attachments */}
                    {post.fileUrls && (() => {
                        try {
                            const urls = JSON.parse(post.fileUrls);
                            if (urls.length > 0) {
                                return (
                                    <div style={{
                                        padding: '1.25rem',
                                        backgroundColor: 'var(--background)',
                                        borderRadius: '14px',
                                        marginBottom: '1rem'
                                    }}>
                                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                            📎 Ekler ({urls.length})
                                        </h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                            {urls.map((url, index) => (
                                                <FilePreview key={index} url={url} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                        } catch (e) { return null; }
                    })()}
                </article>

                {/* Replies Section */}
                <section style={{
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '20px',
                    padding: isMobile ? '1.5rem' : '2rem',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: 'var(--text)',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        💬 Yanıtlar
                        <span style={{
                            backgroundColor: 'rgba(249, 115, 22, 0.15)',
                            color: '#f97316',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                        }}>
                            {post.replies.length}
                        </span>
                    </h2>

                    {/* Reply Form */}
                    {session ? (
                        <form onSubmit={handleReplySubmit} style={{ marginBottom: '2rem' }}>
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Yanıtını yaz..."
                                style={{
                                    ...inputStyle,
                                    height: '120px',
                                    resize: 'vertical',
                                    marginBottom: '1rem',
                                    fontFamily: 'inherit',
                                    lineHeight: '1.6'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#f97316';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,application/pdf,.doc,.docx,.txt"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        padding: '0.75rem 1.25rem',
                                        backgroundColor: 'var(--background)',
                                        border: '1px dashed var(--border)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#f97316';
                                        e.currentTarget.style.color = '#f97316';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }}
                                >
                                    📎 Dosya Ekle
                                </button>

                                <button
                                    type="submit"
                                    disabled={submittingReply || !replyContent.trim()}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: (submittingReply || !replyContent.trim()) ? 'var(--text-secondary)' : 'var(--primary-gradient)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: (submittingReply || !replyContent.trim()) ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.95rem',
                                        transition: 'all 0.3s ease',
                                        boxShadow: (submittingReply || !replyContent.trim()) ? 'none' : '0 4px 15px rgba(249, 115, 22, 0.3)'
                                    }}
                                >
                                    {submittingReply ? '⏳ Gönderiliyor...' : '💬 Yanıtla'}
                                </button>
                            </div>

                            {/* File Preview */}
                            {replyFiles.length > 0 && (
                                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {replyFiles.map((file, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: 'var(--background)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem'
                                        }}>
                                            <span>{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                                            <span style={{ color: 'var(--text)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                            <button type="button" onClick={() => removeFile(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem' }}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </form>
                    ) : (
                        <div style={{
                            padding: '2rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: '14px',
                            textAlign: 'center',
                            marginBottom: '2rem'
                        }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>💬 Yanıt vermek için giriş yapmalısınız</p>
                            <Link href="/login" style={{
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                background: 'var(--primary-gradient)',
                                color: 'white',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                fontWeight: '600'
                            }}>
                                🔑 Giriş Yap
                            </Link>
                        </div>
                    )}

                    {/* Replies List */}
                    {post.replies.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {post.replies.map(reply => (
                                <div key={reply.id} style={{
                                    backgroundColor: 'var(--background)',
                                    padding: '1.25rem',
                                    borderRadius: '14px',
                                    border: '1px solid var(--border)'
                                }}>
                                    {/* Reply Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '10px',
                                                background: 'var(--primary-gradient)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.9rem',
                                                color: 'white',
                                                fontWeight: '700',
                                                overflow: 'hidden'
                                            }}>
                                                {reply.author.avatar ? (
                                                    <img src={reply.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    reply.author.name ? reply.author.name[0].toUpperCase() : '?'
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.95rem' }}>
                                                    {reply.author.name}
                                                    {reply.author.username && (
                                                        <span style={{ color: 'var(--text-secondary)', fontWeight: '400', marginLeft: '0.5rem' }}>@{reply.author.username}</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(reply.createdAt).toLocaleDateString('tr-TR')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reply Actions */}
                                        {session && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <VoteButtons type="reply" id={reply.id} initialVotes={reply.votes || []} />
                                                <button
                                                    onClick={() => openReportModal('reply', reply.id)}
                                                    title="Raporla"
                                                    style={{
                                                        ...actionButtonStyle,
                                                        width: '36px',
                                                        height: '36px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                                        e.currentTarget.style.color = '#ef4444';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'var(--secondary)';
                                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                                        <line x1="4" y1="22" x2="4" y2="15"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reply Content */}
                                    <div style={{ color: 'var(--text)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                        {reply.content}
                                    </div>

                                    {/* Reply Attachments */}
                                    {reply.fileUrls && (() => {
                                        try {
                                            const urls = JSON.parse(reply.fileUrls);
                                            if (urls.length > 0) {
                                                return (
                                                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {urls.map((url, index) => (
                                                            <FilePreview key={index} url={url} />
                                                        ))}
                                                    </div>
                                                );
                                            }
                                        } catch (e) { return null; }
                                    })()}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            color: 'var(--text-secondary)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                            <p>Henüz yanıt yok. İlk yanıtı sen ver!</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
