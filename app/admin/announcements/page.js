'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/roles';

export default function AnnouncementsAdmin() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [userRole, setUserRole] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 767);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const checkAdminAccess = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.role && isAdmin(data.role)) {
                    setUserRole(data.role);
                    fetchAnnouncements();
                } else {
                    router.push('/');
                }
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error('Error checking admin access:', error);
            router.push('/');
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            checkAdminAccess();
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch('/api/admin/announcements');
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });

            if (res.ok) {
                setTitle('');
                setContent('');
                fetchAnnouncements();
            } else {
                const errorData = await res.json();
                alert(`Duyuru oluşturulamadı: ${errorData.error || 'Bilinmeyen hata'}`);
            }
        } catch (error) {
            console.error('Error creating announcement:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`/api/admin/announcements/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setAnnouncements(prev => prev.filter(a => a.id !== id));
            } else {
                alert('Silme işlemi başarısız');
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/admin/announcements/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentStatus })
            });

            if (res.ok) {
                setAnnouncements(prev => prev.map(a =>
                    a.id === id ? { ...a, active: !currentStatus } : a
                ));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (status === 'loading' || !userRole) {
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
                        width: '60px',
                        height: '60px',
                        border: '3px solid var(--border)',
                        borderTopColor: '#f97316',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }} />
                    <div style={{ color: 'var(--text)', fontSize: '1.1rem' }}>Yükleniyor...</div>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)', padding: isMobile ? '1rem' : '2rem' }}>
            {/* Background Gradient */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '350px',
                background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.08) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link href="/admin" style={{
                            textDecoration: 'none',
                            fontSize: '1.5rem',
                            padding: '0.5rem',
                            borderRadius: '12px',
                            background: 'var(--secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '45px',
                            height: '45px',
                            border: '1px solid var(--border)',
                            transition: 'all 0.2s'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#f97316';
                                e.currentTarget.style.transform = 'translateX(-3px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >⬅️</Link>
                        <div>
                            <h1 style={{
                                fontSize: isMobile ? '1.75rem' : '2.5rem',
                                fontWeight: '800',
                                margin: 0,
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>Duyuru Yönetimi</h1>
                            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '1rem' }}>
                                Duyuruları oluşturun, düzenleyin ve yönetin.
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '2rem',
                    alignItems: 'start'
                }}>
                    {/* Left Column: Create Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{
                            background: 'var(--secondary)',
                            padding: isMobile ? '1.5rem' : '2rem',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                        }}>
                            <h2 style={{
                                marginBottom: '1.5rem',
                                fontSize: '1.3rem',
                                color: 'var(--text)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: '700'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>✍️</span> Yeni Duyuru Oluştur
                            </h2>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Başlık</label>
                                    <input
                                        type="text"
                                        placeholder="Örn: Yeni Özellikler Yayında!"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '2px solid var(--border)',
                                            background: 'var(--background)',
                                            color: 'var(--text)',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#f97316'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>İçerik</label>
                                    <textarea
                                        placeholder="Duyuru detaylarını buraya yazın..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                        rows={6}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '2px solid var(--border)',
                                            background: 'var(--background)',
                                            color: 'var(--text)',
                                            fontSize: '1rem',
                                            resize: 'vertical',
                                            outline: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#f97316'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontWeight: '700',
                                        fontSize: '1.1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
                                    }}
                                    onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                    onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                    {loading ? 'Yayınlanıyor...' : '🚀 Duyuruyu Yayınla'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Preview & List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Live Preview */}
                        {(title || content) && (
                            <div style={{
                                background: 'var(--secondary)',
                                padding: '1.5rem',
                                borderRadius: '20px',
                                border: '2px solid #f97316',
                                position: 'relative',
                                boxShadow: '0 4px 20px rgba(249, 115, 22, 0.1)'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    right: '20px',
                                    background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    letterSpacing: '0.5px'
                                }}>
                                    ÖNİZLEME
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text)' }}>
                                    {title || 'Başlık Görünümü'}
                                </h3>
                                <p style={{ color: 'var(--text)', lineHeight: '1.6', fontSize: '1rem' }}>
                                    {content || 'İçerik görünümü burada olacak...'}
                                </p>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', fontStyle: 'italic' }}>
                                    {new Date().toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                        )}

                        {/* Existing Announcements List */}
                        <div>
                            <h2 style={{
                                marginBottom: '1rem',
                                fontSize: '1.3rem',
                                color: 'var(--text)',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>📋</span> Mevcut Duyurular
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {announcements.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem',
                                        color: 'var(--text-secondary)',
                                        background: 'var(--secondary)',
                                        borderRadius: '20px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
                                        Henüz hiç duyuru yok.
                                    </div>
                                ) : (
                                    announcements.map(announcement => (
                                        <div key={announcement.id} style={{
                                            background: 'var(--secondary)',
                                            padding: '1.5rem',
                                            borderRadius: '16px',
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                            opacity: announcement.active ? 1 : 0.7,
                                            transition: 'all 0.2s'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text)', margin: 0 }}>{announcement.title}</h3>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            background: announcement.active ? '#10b981' : '#ef4444',
                                                            color: 'white',
                                                            padding: '2px 10px',
                                                            borderRadius: '20px',
                                                            fontWeight: '700'
                                                        }}>
                                                            {announcement.active ? 'YAYINDA' : 'PASİF'}
                                                        </span>
                                                    </div>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{announcement.content}</p>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(announcement.createdAt).toLocaleDateString('tr-TR')} • <span style={{ color: '#f97316', fontWeight: '600' }}>{announcement.author.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => toggleActive(announcement.id, announcement.active)}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            background: 'transparent',
                                                            color: announcement.active ? '#f59e0b' : '#10b981',
                                                            border: `1px solid ${announcement.active ? '#f59e0b' : '#10b981'}`,
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            fontWeight: '600',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = announcement.active ? '#f59e0b' : '#10b981';
                                                            e.currentTarget.style.color = 'white';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = announcement.active ? '#f59e0b' : '#10b981';
                                                        }}
                                                    >
                                                        {announcement.active ? 'Gizle' : 'Yayınla'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(announcement.id)}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            background: 'transparent',
                                                            color: '#ef4444',
                                                            border: '1px solid #ef4444',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            fontWeight: '600',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#ef4444';
                                                            e.currentTarget.style.color = 'white';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = '#ef4444';
                                                        }}
                                                    >
                                                        Sil
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
