'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { data: session } = useSession();
    const { t } = useLanguage();
    const popupRef = useRef(null);

    useEffect(() => {
        if (session) {
            fetchNotifications();
            // Refresh notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [session]);

    // Close popup when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId })
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'POST'
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return t.language === 'tr' ? 'Şimdi' : 'Now';
        if (diffMins < 60) return `${diffMins}${t.language === 'tr' ? 'd' : 'm'}`;
        if (diffHours < 24) return `${diffHours}${t.language === 'tr' ? 's' : 'h'}`;
        if (diffDays < 7) return `${diffDays}${t.language === 'tr' ? 'g' : 'd'}`;
        return notifDate.toLocaleDateString();
    };

    const truncateText = (text, maxLength = 80) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (!session) return null;

    return (
        <div ref={popupRef} style={{ position: 'fixed', bottom: '2rem', right: '1.5rem', zIndex: 1000 }}>
            {/* Notification Bell Button - Square Design */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                    e.currentTarget.style.boxShadow = '0 6px 30px rgba(249, 115, 22, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.4)';
                }}
            >
                {/* Bell Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '8px',
                        minWidth: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        border: '2px solid var(--background)',
                        padding: '0 4px',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notifications Popup */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '70px',
                    right: '0',
                    width: '380px',
                    maxHeight: '500px',
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--background)'
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: 'var(--text)'
                        }}>
                            {t.language === 'tr' ? '🔔 Bildirimler' : '🔔 Notifications'}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                {t.language === 'tr' ? 'Tümünü okundu işaretle' : 'Mark all read'}
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div style={{
                        maxHeight: '420px',
                        overflowY: 'auto'
                    }}>
                        {notifications.length === 0 ? (
                            <div style={{
                                padding: '3rem 2rem',
                                textAlign: 'center',
                                color: 'var(--text-secondary)'
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔕</div>
                                <p>{t.language === 'tr' ? 'Henüz bildirim yok' : 'No notifications yet'}</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const isMessage = notif.type === 'message';
                                const href = isMessage
                                    ? `/messages/${notif.message?.sender?.id}`
                                    : `/forum/${notif.postId}`;

                                const author = isMessage ? notif.message?.sender : notif.reply?.author;
                                const actionText = isMessage
                                    ? (t.language === 'tr' ? 'mesaj gönderdi' : 'sent a message')
                                    : (t.language === 'tr' ? 'yanıt verdi' : 'replied');
                                const title = isMessage ? '' : `📌 ${notif.reply?.post?.title}`;

                                return (
                                    <Link
                                        key={notif.id}
                                        href={href}
                                        onClick={() => {
                                            markAsRead(notif.id);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            display: 'block',
                                            padding: '1rem 1.25rem',
                                            borderBottom: '1px solid var(--border)',
                                            textDecoration: 'none',
                                            backgroundColor: notif.isRead ? 'transparent' : 'rgba(225, 48, 108, 0.05)',
                                            transition: 'all 0.2s ease',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(225, 48, 108, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = notif.isRead ? 'transparent' : 'rgba(225, 48, 108, 0.05)';
                                        }}
                                    >
                                        {/* Unread indicator */}
                                        {!notif.isRead && (
                                            <div style={{
                                                position: 'absolute',
                                                left: '0.5rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--primary)'
                                            }} />
                                        )}

                                        <div style={{ display: 'flex', gap: '0.75rem', paddingLeft: !notif.isRead ? '1rem' : '0' }}>
                                            {/* Author Avatar */}
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--background)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                                border: '2px solid var(--border)'
                                            }}>
                                                {author?.avatar ? (
                                                    <img src={author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ color: 'var(--text)', fontWeight: 'bold' }}>
                                                        {author?.firstName?.[0] || '?'}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {/* Author name */}
                                                <div style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    color: 'var(--text)',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    {author?.firstName} {author?.lastName}
                                                    <span style={{
                                                        fontWeight: 'normal',
                                                        color: 'var(--text-secondary)',
                                                        marginLeft: '0.3rem'
                                                    }}>
                                                        {actionText}
                                                    </span>
                                                </div>

                                                {/* Content preview */}
                                                <div style={{
                                                    fontSize: '0.85rem',
                                                    color: 'var(--text-secondary)',
                                                    lineHeight: '1.4',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    {truncateText(notif.content)}
                                                </div>

                                                {/* Title & time */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    <span style={{
                                                        color: 'var(--primary)',
                                                        fontWeight: '500',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '200px'
                                                    }}>
                                                        {title}
                                                    </span>
                                                    <span>{formatTime(notif.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Animations */}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
