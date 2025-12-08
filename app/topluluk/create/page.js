'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useForumPost } from '@/contexts/ForumPostContext';
import { useAlert } from '@/contexts/AlertContext';
import FilePreview from '@/components/FilePreview';

export default function CreatePost() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const { t } = useLanguage();
    const { startSubmission, pendingPost } = useForumPost();
    const { showAlert, showConfirm } = useAlert();

    // Check mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (pendingPost) {
            setTitle(pendingPost.title);
            setContent(pendingPost.content);
            setTags(pendingPost.tags);
            if (pendingPost.files) {
                setFiles(pendingPost.files);
            }
        }
    }, [pendingPost]);

    // Track unsaved changes
    useEffect(() => {
        const hasContent = title.trim() !== '' || content.trim() !== '' || tags.trim() !== '' || files.length > 0;
        setHasUnsavedChanges(hasContent);
    }, [title, content, tags, files]);

    // Warn on browser close/refresh
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Custom Link wrapper to intercept navigation
    const handleLinkClick = async (e, href) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            const confirmed = await showConfirm(
                'Değişiklikleriniz kaydedilmedi! Çıkışı onaylıyor musunuz? Tüm verileriniz kaybolacak.'
            );
            if (confirmed) {
                setHasUnsavedChanges(false);
                router.push(href);
            }
        }
    };

    const handleFileChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            await showAlert(t.forumCreate?.maxFiles || 'Maksimum 5 dosya yükleyebilirsiniz', 'warning');
            return;
        }
        setFiles((prev) => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowWarningModal(true);
    };

    const handleConfirmPost = async () => {
        setShowWarningModal(false);
        setHasUnsavedChanges(false);
        startSubmission({ title, content, tags, files });
    };

    const inputStyle = {
        width: '100%',
        padding: '1rem 1.25rem',
        borderRadius: '14px',
        border: '2px solid var(--border)',
        backgroundColor: 'var(--secondary)',
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
                height: '500px',
                background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.08) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: isMobile ? '1rem' : '2rem 1rem',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Back Button */}
                <a
                    href="/topluluk"
                    onClick={(e) => handleLinkClick(e, '/topluluk')}
                    style={{
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
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#f97316';
                        e.currentTarget.style.color = '#f97316';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text)';
                    }}>
                    ← {t.forumDetail?.backToForum || 'Topluluğa Dön'}
                </a>

                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '2.5rem',
                    padding: isMobile ? '1.5rem' : '2rem',
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '24px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        fontSize: '2.5rem',
                        boxShadow: '0 8px 25px rgba(249, 115, 22, 0.3)'
                    }}>
                        💬
                    </div>
                    <h1 style={{
                        fontSize: isMobile ? '1.75rem' : '2.25rem',
                        fontWeight: '800',
                        marginBottom: '0.75rem',
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {t.forumCreate?.title || 'Yeni Tartışma Başlat'}
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1rem',
                        maxWidth: '400px',
                        margin: '0 auto'
                    }}>
                        Sorunu sor, deneyimini paylaş, topluluğa katkıda bulun 🚀
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Title & Content Section */}
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '20px',
                        padding: isMobile ? '1.5rem' : '2rem',
                        border: '1px solid var(--border)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'var(--primary-gradient)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.4rem'
                            }}>
                                ✍️
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.25rem', fontWeight: '700' }}>
                                    Tartışma Detayları
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Başlık ve içerik ekle
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Title */}
                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem',
                                    color: 'var(--text)',
                                    fontWeight: '600',
                                    fontSize: '0.95rem'
                                }}>
                                    <span style={{ color: '#f97316' }}>●</span>
                                    {t.forumCreate?.titleLabel || 'Başlık'} *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="ör. Calculus II Sınav Sorusu Hakkında Yardım"
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#f97316';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem',
                                    color: 'var(--text)',
                                    fontWeight: '600',
                                    fontSize: '0.95rem'
                                }}>
                                    <span style={{ color: '#f97316' }}>●</span>
                                    {t.forumCreate?.contentLabel || 'İçerik'} *
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    rows={8}
                                    placeholder="Sorunuzu veya konuyu detaylı bir şekilde açıklayın..."
                                    style={{
                                        ...inputStyle,
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.6',
                                        minHeight: '200px'
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
                            </div>
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '20px',
                        padding: isMobile ? '1.5rem' : '2rem',
                        border: '1px solid var(--border)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.4rem'
                            }}>
                                🏷️
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.25rem', fontWeight: '700' }}>
                                    Etiketler
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Tartışmanı kategorize et
                                </p>
                            </div>
                        </div>

                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontWeight: '600',
                                fontSize: '0.95rem'
                            }}>
                                <span style={{ color: '#fbbf24' }}>●</span>
                                {t.forumCreate?.tagsLabel || 'Etiketler'}
                            </label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder={t.forumCreate?.tagsPlaceholder || 'matematik, sınav, yardım (virgülle ayırın)'}
                                style={inputStyle}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#fbbf24';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginTop: '0.75rem',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                                borderRadius: '10px',
                                border: '1px solid rgba(251, 191, 36, 0.2)'
                            }}>
                                <span>💡</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    İpucu: Etiketleri virgülle ayırın (ör: matematik, sınav, yardım)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Files Section */}
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '20px',
                        padding: isMobile ? '1.5rem' : '2rem',
                        border: '1px solid var(--border)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.4rem'
                            }}>
                                📎
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.25rem', fontWeight: '700' }}>
                                    Dosyalar
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Ekran görüntüsü veya döküman ekle (Maksimum 5)
                                </p>
                            </div>
                        </div>

                        <label style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1rem',
                            padding: '2.5rem 2rem',
                            borderRadius: '16px',
                            border: '3px dashed var(--border)',
                            backgroundColor: 'var(--background)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            minHeight: '180px'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#f97316';
                                e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.backgroundColor = 'var(--background)';
                            }}>
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '16px',
                                background: 'rgba(249, 115, 22, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem'
                            }}>
                                📁
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    color: 'var(--text)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Dosya Yükle
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    PDF, Word, Excel, PowerPoint, Resim
                                </div>
                            </div>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*"
                                style={{ display: 'none' }}
                            />
                        </label>

                        {/* File List */}
                        {files.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '1rem',
                                marginTop: '1.5rem'
                            }}>
                                {files.map((file, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: 'var(--background)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <span style={{ fontSize: '1.25rem' }}>
                                            {file.type?.startsWith('image/') ? '🖼️' : '📄'}
                                        </span>
                                        <span style={{
                                            flex: 1,
                                            fontSize: '0.85rem',
                                            color: 'var(--text)',
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
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--text-secondary)',
                                                fontSize: '1.25rem',
                                                padding: '0',
                                                lineHeight: 1,
                                                transition: 'color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button type="submit" disabled={loading} style={{
                        padding: '1.25rem 1.5rem',
                        background: loading ? 'var(--text-secondary)' : 'var(--primary-gradient)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.3s ease',
                        boxShadow: loading ? 'none' : '0 8px 25px rgba(249, 115, 22, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem'
                    }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 30px rgba(249, 115, 22, 0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.4)';
                        }}>
                        {loading ? '⏳ Paylaşılıyor...' : '🚀 Tartışmayı Paylaş'}
                    </button>

                    {/* Upload Progress */}
                    {loading && uploadProgress > 0 && (
                        <div style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '14px',
                            padding: '1.25rem',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem',
                                color: 'var(--text)'
                            }}>
                                <span>Yükleniyor...</span>
                                <span style={{ color: '#f97316', fontWeight: '600' }}>{uploadProgress}%</span>
                            </div>
                            <div style={{
                                height: '8px',
                                backgroundColor: 'var(--background)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${uploadProgress}%`,
                                    background: 'var(--primary-gradient)',
                                    transition: 'width 0.3s ease',
                                    borderRadius: '4px'
                                }} />
                            </div>
                        </div>
                    )}
                </form>

                {/* Warning Modal */}
                {showWarningModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                        onClick={() => setShowWarningModal(false)}>
                        <div style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '24px',
                            padding: isMobile ? '1.5rem' : '2.5rem',
                            maxWidth: '450px',
                            width: '100%',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                            border: '1px solid var(--border)',
                            animation: 'modalSlideIn 0.3s ease'
                        }}
                            onClick={(e) => e.stopPropagation()}>
                            <style jsx>{`
                                @keyframes modalSlideIn {
                                    from {
                                        opacity: 0;
                                        transform: scale(0.9) translateY(20px);
                                    }
                                    to {
                                        opacity: 1;
                                        transform: scale(1) translateY(0);
                                    }
                                }
                            `}</style>

                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 1.5rem',
                                borderRadius: '20px',
                                background: 'var(--primary-gradient)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.5rem',
                                boxShadow: '0 8px 25px rgba(249, 115, 22, 0.3)'
                            }}>
                                🚀
                            </div>

                            <h2 style={{
                                marginBottom: '1rem',
                                color: 'var(--text)',
                                textAlign: 'center',
                                fontSize: '1.5rem',
                                fontWeight: '700'
                            }}>
                                Tartışmayı Paylaş?
                            </h2>

                            <p style={{
                                color: 'var(--text-secondary)',
                                marginBottom: '2rem',
                                textAlign: 'center',
                                lineHeight: '1.6'
                            }}>
                                Tartışman forumda herkese açık olarak yayınlanacak. Devam etmek istediğinden emin misin?
                            </p>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowWarningModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        backgroundColor: 'transparent',
                                        color: 'var(--text)',
                                        border: '2px solid var(--border)',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1rem',
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
                                    İptal
                                </button>
                                <button
                                    onClick={handleConfirmPost}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        background: 'var(--primary-gradient)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(249, 115, 22, 0.4)';
                                    }}>
                                    Evet, Paylaş
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
