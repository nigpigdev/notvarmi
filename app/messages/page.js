'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function MessagesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
            fetchConversations();
        }
    }, [status]);

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/messages');
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatLastSeen = (lastSeenDate) => {
        if (!lastSeenDate) return '';
        const now = new Date();
        const lastSeen = new Date(lastSeenDate);
        const diffMs = now - lastSeen;
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Az önce';
        if (minutes < 60) return `${minutes} dk önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;
        return lastSeen.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const formatMessageTime = (date) => {
        const now = new Date();
        const msgDate = new Date(date);
        const isToday = now.toDateString() === msgDate.toDateString();

        if (isToday) {
            return msgDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }
        return msgDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const filteredConversations = conversations.filter(conv => {
        const name = conv.user.name || conv.user.username || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

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

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--background)',
            padding: isMobile ? '1rem 0.75rem' : '2rem 1rem'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    marginBottom: isMobile ? '1.25rem' : '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: isMobile ? '48px' : '56px',
                            height: isMobile ? '48px' : '56px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isMobile ? '1.5rem' : '1.75rem',
                            boxShadow: '0 8px 25px rgba(249, 115, 22, 0.3)'
                        }}>
                            💬
                        </div>
                        <div>
                            <h1 style={{
                                fontSize: isMobile ? '1.5rem' : '2rem',
                                fontWeight: '800',
                                color: 'var(--text)',
                                margin: 0,
                                letterSpacing: '-0.02em'
                            }}>
                                Mesajlar
                            </h1>
                            <p style={{
                                margin: 0,
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem'
                            }}>
                                {conversations.length} sohbet
                            </p>
                        </div>
                    </div>
                    <Link href="/topluluk" style={{
                        padding: '0.65rem 1.25rem',
                        background: 'var(--secondary)',
                        color: 'var(--text)',
                        textDecoration: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        border: '1px solid var(--border)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
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
                </div>

                {/* Search Bar */}
                {conversations.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <span style={{
                                position: 'absolute',
                                left: '1rem',
                                color: 'var(--text-secondary)',
                                fontSize: '1.1rem'
                            }}>🔍</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Sohbetlerde ara..."
                                style={{
                                    width: '100%',
                                    padding: '0.9rem 1rem 0.9rem 2.75rem',
                                    border: '2px solid transparent',
                                    borderRadius: '14px',
                                    background: 'var(--secondary)',
                                    color: 'var(--text)',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#f97316';
                                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Conversations List */}
                {conversations.length === 0 ? (
                    <div style={{
                        background: 'var(--secondary)',
                        borderRadius: '24px',
                        padding: isMobile ? '3rem 1.5rem' : '4rem 2rem',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            margin: '0 auto 1.5rem',
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem'
                        }}>
                            💬
                        </div>
                        <h2 style={{
                            color: 'var(--text)',
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            marginBottom: '0.75rem'
                        }}>
                            Henüz mesajınız yok
                        </h2>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '1rem',
                            maxWidth: '350px',
                            margin: '0 auto 1.5rem',
                            lineHeight: '1.6'
                        }}>
                            Bir kullanıcının profiline giderek mesaj göndermeye başlayın!
                        </p>
                        <Link href="/topluluk" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.9rem 1.75rem',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '14px',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            boxShadow: '0 8px 25px rgba(249, 115, 22, 0.35)',
                            transition: 'all 0.2s'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 30px rgba(249, 115, 22, 0.45)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.35)';
                            }}>
                            🚀 Topluluğu Keşfet
                        </Link>
                    </div>
                ) : (
                    <div style={{
                        background: 'var(--secondary)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 15px 50px rgba(0,0,0,0.08)',
                        border: '1px solid var(--border)'
                    }}>
                        {filteredConversations.length === 0 ? (
                            <div style={{
                                padding: '3rem',
                                textAlign: 'center',
                                color: 'var(--text-secondary)'
                            }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
                                <p>"{searchQuery}" için sonuç bulunamadı</p>
                            </div>
                        ) : (
                            filteredConversations.map((conversation, index) => (
                                <Link
                                    key={conversation.userId}
                                    href={`/messages/${conversation.userId}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: isMobile ? '0.9rem' : '1.25rem',
                                        padding: isMobile ? '1rem' : '1.25rem 1.5rem',
                                        textDecoration: 'none',
                                        borderBottom: index < filteredConversations.length - 1 ? '1px solid var(--border)' : 'none',
                                        transition: 'all 0.2s ease',
                                        background: conversation.unreadCount > 0 ? 'rgba(249, 115, 22, 0.04)' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = conversation.unreadCount > 0 ? 'rgba(249, 115, 22, 0.04)' : 'transparent';
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        {conversation.user.avatar ? (
                                            <div style={{
                                                width: isMobile ? '50px' : '56px',
                                                height: isMobile ? '50px' : '56px',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                border: '2px solid transparent',
                                                background: 'linear-gradient(135deg, #fbbf24, #f97316, #ec4899) padding-box, linear-gradient(135deg, #fbbf24, #f97316, #ec4899) border-box'
                                            }}>
                                                <Image
                                                    src={conversation.user.avatar}
                                                    alt={conversation.user.name || conversation.user.username}
                                                    width={56}
                                                    height={56}
                                                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{
                                                width: isMobile ? '50px' : '56px',
                                                height: isMobile ? '50px' : '56px',
                                                borderRadius: '16px',
                                                background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: isMobile ? '1.25rem' : '1.5rem',
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }}>
                                                {conversation.user.name ? conversation.user.name.charAt(0).toUpperCase() : '👤'}
                                            </div>
                                        )}
                                        {/* Online Indicator */}
                                        {conversation.user.showOnlineStatus !== false && conversation.user.isOnline && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '2px',
                                                right: '2px',
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                background: '#22c55e',
                                                border: '2px solid var(--secondary)'
                                            }} />
                                        )}
                                    </div>

                                    {/* Message Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.35rem'
                                        }}>
                                            <h3 style={{
                                                margin: 0,
                                                color: 'var(--text)',
                                                fontSize: isMobile ? '1rem' : '1.1rem',
                                                fontWeight: conversation.unreadCount > 0 ? '700' : '600'
                                            }}>
                                                {conversation.user.name || conversation.user.username}
                                            </h3>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                color: conversation.unreadCount > 0 ? '#f97316' : 'var(--text-secondary)',
                                                fontWeight: conversation.unreadCount > 0 ? '600' : '400'
                                            }}>
                                                {formatMessageTime(conversation.lastMessageTime)}
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '0.5rem'
                                        }}>
                                            <p style={{
                                                margin: 0,
                                                color: conversation.unreadCount > 0 ? 'var(--text)' : 'var(--text-secondary)',
                                                fontSize: '0.9rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontWeight: conversation.unreadCount > 0 ? '500' : '400'
                                            }}>
                                                {conversation.lastMessage}
                                            </p>
                                            {conversation.unreadCount > 0 && (
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                                                    color: 'white',
                                                    borderRadius: '10px',
                                                    minWidth: '24px',
                                                    height: '24px',
                                                    padding: '0 6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    flexShrink: 0
                                                }}>
                                                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        {/* Last Seen */}
                                        {conversation.user.showOnlineStatus !== false && !conversation.user.isOnline && conversation.user.lastSeen && (
                                            <p style={{
                                                margin: '0.25rem 0 0',
                                                fontSize: '0.75rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                {formatLastSeen(conversation.user.lastSeen)}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
