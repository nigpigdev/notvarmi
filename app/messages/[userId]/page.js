'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from '@/components/features/ChatInterface';

export default function ConversationPage({ params }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { userId } = use(params);
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            if (!userId || userId === 'undefined') {
                console.warn('Redirecting invalid userId:', userId);
                router.push('/messages');
                return;
            }
            fetchUserData();
        }
    }, [status, userId]);

    const fetchUserData = async () => {
        try {
            const res = await fetch(`/api/messages/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setOtherUser(data.otherUser);
            } else {
                const text = await res.text();
                try {
                    const errorData = JSON.parse(text);
                    setError(errorData.error || 'Bir hata oluştu');
                } catch (e) {
                    setError('Sunucu hatası');
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'var(--background)'
            }}>
                <div style={{
                    background: 'var(--secondary)',
                    padding: '2rem 3rem',
                    borderRadius: '20px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        border: '3px solid #f97316',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ color: '#f97316', fontWeight: '600', fontSize: '1.1rem' }}>Yükleniyor...</span>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!otherUser) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--background)',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    textAlign: 'center',
                    background: 'var(--secondary)',
                    padding: '3rem 2rem',
                    borderRadius: '24px',
                    border: '1px solid var(--border)',
                    maxWidth: '400px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 1.5rem',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem'
                    }}>
                        😕
                    </div>
                    <h1 style={{
                        color: 'var(--text)',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        marginBottom: '0.75rem'
                    }}>
                        {error || 'Kullanıcı bulunamadı'}
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '1.5rem',
                        lineHeight: '1.5'
                    }}>
                        Bu kullanıcıya erişilemiyor veya mevcut değil.
                    </p>
                    <Link href="/messages" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem 1.5rem',
                        background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '14px',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        boxShadow: '0 6px 20px rgba(249, 115, 22, 0.35)',
                        transition: 'all 0.2s'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(249, 115, 22, 0.45)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.35)';
                        }}>
                        ← Mesajlara Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--background)',
            padding: isMobile ? '1rem 0.75rem' : '2rem 1rem'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Back Button - Desktop Only (Mobile has it in ChatInterface) */}
                {!isMobile && (
                    <Link href="/messages" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        background: 'var(--secondary)',
                        border: '1px solid var(--border)'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#f97316';
                            e.currentTarget.style.borderColor = '#f97316';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                        }}>
                        ← Tüm Mesajlar
                    </Link>
                )}

                {/* Chat Interface */}
                <ChatInterface userId={userId} otherUser={otherUser} />
            </div>
        </div>
    );
}
