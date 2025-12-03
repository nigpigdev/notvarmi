'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import FilePreview from '@/components/FilePreview';
import VoteButtons from '@/components/VoteButtons';
import ReportModal from '@/components/ReportModal';
import ShareButton from '@/components/ShareButton';

export default function PostDetail() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [replyFiles, setReplyFiles] = useState([]);
    const [reportModal, setReportModal] = useState({ isOpen: false, type: null, id: null });
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/forum/posts/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setPost(data);
                }
            } catch (error) {
                console.error('Failed to fetch post', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchPost();
        }
    }, [params.id]);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmittingReply(true);
        try {
            const formData = new FormData();
            formData.append('content', replyContent);

            // Append files
            replyFiles.forEach((file) => {
                formData.append('files', file);
            });

            const res = await fetch(`/api/forum/posts/${params.id}/replies`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const newReply = await res.json();
                setPost(prev => ({
                    ...prev,
                    replies: [...prev.replies, newReply]
                }));
                setReplyContent('');
                setReplyFiles([]);
            } else {
                alert('Failed to submit reply');
            }
        } catch (error) {
            console.error('Error submitting reply:', error);
            alert('Error submitting reply');
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

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading discussion...</div>;
    }

    if (!post) {
        return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Discussion not found.</div>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <Link href="/forum" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '2rem',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                transition: 'color 0.2s ease'
            }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-teal)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Foruma Dön
            </Link>

            <ReportModal
                isOpen={reportModal.isOpen}
                onClose={() => setReportModal({ isOpen: false, type: null, id: null })}
                type={reportModal.type}
                id={reportModal.id}
            />

            <div style={{
                backgroundColor: 'var(--secondary)',
                borderRadius: '16px',
                padding: '2rem',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {post.tags.split(',').map((tag, idx) => {
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

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {session && (
                                <>
                                    <VoteButtons type="post" id={post.id} initialVotes={post.votes || []} />
                                    <ShareButton title={post.title} text={`${post.title} - Notvarmı'da bu tartışmaya göz at!`} />
                                    <button
                                        onClick={() => openReportModal('post', post.id)}
                                        title="Raporla"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            padding: '0.2rem',
                                            color: 'var(--text-secondary)',
                                            opacity: 0.7,
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                            <line x1="4" y1="22" x2="4" y2="15"></line>
                                        </svg>
                                    </button>
                                </>
                            )}
                            {!session && (
                                <ShareButton title={post.title} text={`${post.title} - Notvarmı'da bu tartışmaya göz at!`} />
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <h1 style={{
                            fontSize: '2rem',
                            color: 'var(--text)',
                            lineHeight: 1.3,
                            margin: 0
                        }}>
                            {post.title.replace('(Not Paylaşıldı) ', '')}
                        </h1>
                        {post.title.startsWith('(Not Paylaşıldı)') && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.4rem 0.9rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                color: 'white',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                                whiteSpace: 'nowrap'
                            }}>
                                📚 Not Paylaşıldı
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--background)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                                overflow: 'hidden'
                            }}>
                                {post.author.avatar ? (
                                    <img src={post.author.avatar} alt={post.author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    post.author.name ? post.author.name[0].toUpperCase() : '?'
                                )}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                                    {session ? (
                                        <Link href={`/profile/${post.author.username}`} style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.1rem', textDecoration: 'none', transition: 'color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-teal)'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}>
                                            {post.author.name || 'Unknown'}
                                        </Link>
                                    ) : (
                                        <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.1rem', cursor: 'pointer' }}
                                            onClick={() => router.push('/login')}>
                                            {post.author.name || 'Unknown'}
                                        </span>
                                    )}
                                    {post.author.username && (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>@{post.author.username}</span>
                                    )}
                                </div>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.2rem'
                                }}>
                                    {(post.author.university || post.author.department) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {post.author.university && <span>{post.author.university}</span>}
                                            {post.author.university && post.author.department && <span style={{ opacity: 0.5 }}>|</span>}
                                            {post.author.department && <span>{post.author.department}</span>}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        <span style={{ fontSize: '0.85rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            👁️ {post.viewCount || 0} Görüntülenme
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                    color: 'var(--text)',
                    marginBottom: '2rem',
                    whiteSpace: 'pre-wrap'
                }}>
                    {post.content}
                </div>

                {post.fileUrls && (() => {
                    try {
                        const urls = JSON.parse(post.fileUrls);
                        if (urls.length > 0) {
                            return (
                                <div style={{
                                    borderTop: '1px solid var(--border)',
                                    paddingTop: '1.5rem',
                                    marginBottom: '2rem'
                                }}>


                                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Attachments</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                        {urls.map((url, index) => (
                                            <FilePreview key={index} url={url} />
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                    } catch (e) {
                        return null;
                    }
                })()}

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>Replies ({post.replies.length})</h3>

                    {session ? (
                        <form onSubmit={handleReplySubmit} style={{ marginBottom: '2rem' }}>
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Yanıtını yaz..."
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    height: '150px',
                                    resize: 'vertical',
                                    marginBottom: '1rem',
                                    outline: 'none',
                                    overflowY: 'auto',
                                    fontFamily: 'inherit',
                                    lineHeight: '1.6',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--accent-teal)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />

                            {/* File Upload Section */}
                            <div style={{ marginBottom: '1rem' }}>
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
                                        background: 'var(--background)',
                                        border: '1px dashed var(--border)',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s',
                                        fontWeight: '500'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent-teal)';
                                        e.currentTarget.style.color = 'var(--accent-teal)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }}
                                >
                                    📎 Dosya Ekle
                                </button>

                                {/* File Preview */}
                                {replyFiles.length > 0 && (
                                    <div style={{
                                        marginTop: '1rem',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.75rem'
                                    }}>
                                        {replyFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    background: 'var(--background)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '10px',
                                                    padding: '0.6rem 0.9rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.6rem',
                                                    fontSize: '0.85rem',
                                                    maxWidth: '250px'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.2rem' }}>
                                                    {file.type.startsWith('image/') ? '🖼️' : '📄'}
                                                </span>
                                                <span style={{
                                                    color: 'var(--text)',
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {file.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-secondary)',
                                                        fontSize: '1.1rem',
                                                        padding: '0',
                                                        lineHeight: 1,
                                                        transition: 'color 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submittingReply || !replyContent.trim()}
                                style={{
                                    padding: '0.9rem 1.8rem',
                                    background: (submittingReply || !replyContent.trim()) ? 'var(--text-secondary)' : 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: (submittingReply || !replyContent.trim()) ? 'not-allowed' : 'pointer',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease',
                                    boxShadow: (submittingReply || !replyContent.trim()) ? 'none' : '0 4px 14px rgba(20, 184, 166, 0.4)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (!submittingReply && replyContent.trim()) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(20, 184, 166, 0.5)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(20, 184, 166, 0.4)';
                                }}>
                                {submittingReply ? '⏳ Gönderiliyor...' : '💬 Yanıtla'}
                            </button>
                        </form>
                    ) : (
                        <div style={{
                            padding: '1.5rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: '12px',
                            border: '2px dashed var(--border)',
                            textAlign: 'center',
                            marginBottom: '2rem'
                        }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1rem' }}>💬 Yanıt vermek için giriş yapmalısınız</p>
                            <Link href="/login" style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--primary-gradient)',
                                color: 'white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: '600',
                                display: 'inline-block',
                                transition: 'transform 0.2s'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                🔑 Giriş Yap
                            </Link>
                        </div>
                    )}

                    {post.replies.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {post.replies.map(reply => (
                                <div key={reply.id} style={{
                                    backgroundColor: 'var(--background)',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1rem',
                                                color: 'var(--text)',
                                                border: '1px solid var(--border)',
                                                overflow: 'hidden',
                                                flexShrink: 0
                                            }}>
                                                {reply.author.avatar ? (
                                                    <img src={reply.author.avatar} alt={reply.author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    reply.author.name ? reply.author.name[0].toUpperCase() : '?'
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                                                    {session ? (
                                                        <Link href={`/profile/${reply.author.username}`} style={{ fontWeight: '600', color: 'var(--text)', fontSize: '1rem', textDecoration: 'none', transition: 'color 0.2s' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-teal)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}>
                                                            {reply.author.name}
                                                        </Link>
                                                    ) : (
                                                        <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '1rem', cursor: 'pointer' }}
                                                            onClick={() => router.push('/login')}>
                                                            {reply.author.name}
                                                        </span>
                                                    )}
                                                    {reply.author.username && (
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>@{reply.author.username}</span>
                                                    )}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.85rem',
                                                    color: 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    {reply.author.university && <span>{reply.author.university}</span>}
                                                    {reply.author.university && reply.author.department && <span style={{ opacity: 0.5 }}>•</span>}
                                                    {reply.author.department && <span>{reply.author.department}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem', gap: '1rem', alignItems: 'center' }}>
                                        {session && (
                                            <>
                                                <VoteButtons type="reply" id={reply.id} initialVotes={reply.votes || []} />
                                                <button
                                                    onClick={() => openReportModal('reply', reply.id)}
                                                    title="Raporla"
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '1rem',
                                                        padding: '0.2rem',
                                                        color: 'var(--text-secondary)',
                                                        opacity: 0.7,
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                                        <line x1="4" y1="22" x2="4" y2="15"></line>
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div style={{ color: 'var(--text)', lineHeight: 1.5, marginBottom: '1rem' }}>{reply.content}</div>

                                    {/* Reply Attachments */}
                                    {reply.fileUrls && (() => {
                                        try {
                                            const urls = JSON.parse(reply.fileUrls);
                                            if (urls.length > 0) {
                                                return (
                                                    <div style={{
                                                        marginTop: '1rem',
                                                        borderTop: '1px solid var(--border)',
                                                        paddingTop: '1rem'
                                                    }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                            {urls.map((url, index) => (
                                                                <FilePreview key={index} url={url} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        } catch (e) {
                                            return null;
                                        }
                                    })()}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Henüz yanıt yok.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
