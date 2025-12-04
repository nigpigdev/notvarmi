'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

export default function ChatInterface({ userId, otherUser }) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/messages/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: userId,
                    content: newMessage.trim()
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages([...messages, data.message]);
                setNewMessage('');
                inputRef.current?.focus();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatMessageTime = (date) => {
        return new Date(date).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatMessageDate = (date) => {
        const msgDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (msgDate.toDateString() === today.toDateString()) return 'Bugün';
        if (msgDate.toDateString() === yesterday.toDateString()) return 'Dün';
        return msgDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatLastSeen = (lastSeenDate) => {
        if (!lastSeenDate) return '';
        const now = new Date();
        const lastSeen = new Date(lastSeenDate);
        const diffMs = now - lastSeen;
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Az önce aktif';
        if (minutes < 60) return `${minutes} dk önce aktif`;
        if (hours < 24) return `${hours} saat önce aktif`;
        if (days < 7) return `${days} gün önce aktif`;
        return lastSeen.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' aktif';
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = new Date(message.createdAt).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(message);
        return groups;
    }, {});

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 'calc(100vh - 2rem)' : 'calc(100vh - 4rem)',
            background: 'var(--secondary)',
            borderRadius: isMobile ? '20px' : '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            border: '1px solid var(--border)'
        }}>
            {/* Chat Header */}
            <div style={{
                padding: isMobile ? '1rem' : '1.25rem 1.5rem',
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.75rem' : '1rem'
            }}>
                {/* Back Button (Mobile) */}
                <Link href="/messages" style={{
                    display: isMobile ? 'flex' : 'none',
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: 'var(--secondary)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                    color: 'var(--text)',
                    fontSize: '1.1rem',
                    transition: 'all 0.2s'
                }}>
                    ←
                </Link>

                {/* Avatar */}
                <Link href={`/profile/${otherUser.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    {otherUser.avatar ? (
                        <div style={{
                            width: isMobile ? '44px' : '50px',
                            height: isMobile ? '44px' : '50px',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            border: '2px solid transparent',
                            background: 'linear-gradient(135deg, #fbbf24, #f97316, #ec4899) padding-box, linear-gradient(135deg, #fbbf24, #f97316, #ec4899) border-box',
                            transition: 'transform 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Image
                                src={otherUser.avatar}
                                alt={otherUser.name || otherUser.username}
                                width={50}
                                height={50}
                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                        </div>
                    ) : (
                        <div style={{
                            width: isMobile ? '44px' : '50px',
                            height: isMobile ? '44px' : '50px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isMobile ? '1.25rem' : '1.4rem',
                            color: 'white',
                            fontWeight: 'bold',
                            transition: 'transform 0.2s'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {otherUser.name ? otherUser.name.charAt(0).toUpperCase() : '👤'}
                        </div>
                    )}
                </Link>

                {/* User Info */}
                <Link
                    href={`/profile/${otherUser.username}`}
                    style={{
                        textDecoration: 'none',
                        flex: 1,
                        minWidth: 0,
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                    <h2 style={{
                        margin: 0,
                        color: 'var(--text)',
                        fontSize: isMobile ? '1.05rem' : '1.15rem',
                        fontWeight: '700',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {otherUser.name || otherUser.username}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{
                            margin: 0,
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem'
                        }}>
                            @{otherUser.username}
                        </p>
                        {otherUser.showOnlineStatus !== false && (
                            otherUser.isOnline ? (
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    color: '#22c55e',
                                    fontSize: '0.8rem',
                                    fontWeight: '500'
                                }}>
                                    <span style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#22c55e'
                                    }} />
                                    çevrimiçi
                                </span>
                            ) : otherUser.lastSeen && (
                                <span style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.75rem'
                                }}>
                                    • {formatLastSeen(otherUser.lastSeen)}
                                </span>
                            )
                        )}
                    </div>
                </Link>

                {/* Profile Link (Desktop) */}
                <Link href={`/profile/${otherUser.username}`} style={{
                    display: isMobile ? 'none' : 'flex',
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    background: 'var(--secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    alignItems: 'center',
                    gap: '0.4rem',
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
                    👤 Profil
                </Link>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: isMobile ? '1rem' : '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                background: 'var(--background)'
            }}>
                {messages.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        padding: isMobile ? '2rem 1rem' : '4rem 2rem',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            marginBottom: '1rem'
                        }}>
                            💬
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                            Henüz mesaj yok
                        </p>
                        <p style={{ fontSize: '0.9rem' }}>
                            Sohbete başlamak için ilk mesajı gönderin!
                        </p>
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([date, dateMessages]) => (
                        <div key={date}>
                            {/* Date Separator */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '1rem 0'
                            }}>
                                <span style={{
                                    background: 'var(--secondary)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    padding: '0.4rem 1rem',
                                    borderRadius: '20px',
                                    fontWeight: '500'
                                }}>
                                    {formatMessageDate(dateMessages[0].createdAt)}
                                </span>
                            </div>

                            {/* Messages */}
                            {dateMessages.map((message) => {
                                const isOwnMessage = message.sender.id !== userId;
                                return (
                                    <div
                                        key={message.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                                            marginBottom: '0.5rem'
                                        }}
                                    >
                                        <div style={{
                                            maxWidth: isMobile ? '85%' : '70%',
                                            minWidth: '80px',
                                            padding: '0.75rem 1rem',
                                            borderRadius: isOwnMessage
                                                ? '18px 18px 6px 18px'
                                                : '18px 18px 18px 6px',
                                            background: isOwnMessage
                                                ? 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)'
                                                : 'var(--secondary)',
                                            color: isOwnMessage ? 'white' : 'var(--text)',
                                            boxShadow: isOwnMessage
                                                ? '0 4px 15px rgba(249, 115, 22, 0.25)'
                                                : '0 2px 8px rgba(0,0,0,0.04)',
                                            border: isOwnMessage ? 'none' : '1px solid var(--border)'
                                        }}>
                                            <p style={{
                                                margin: 0,
                                                lineHeight: '1.5',
                                                wordBreak: 'break-word',
                                                fontSize: '0.95rem'
                                            }}>
                                                {message.content}
                                            </p>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: '4px',
                                                fontSize: '0.7rem',
                                                opacity: isOwnMessage ? 0.85 : 0.6,
                                                marginTop: '0.35rem'
                                            }}>
                                                <span>{formatMessageTime(message.createdAt)}</span>
                                                {isOwnMessage && (
                                                    <span style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginLeft: '2px'
                                                    }}>
                                                        {message.read ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                                <polyline points="20 12 9 23 4 18" style={{ transform: 'translate(4px, -6px)' }}></polyline>
                                                            </svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} style={{
                padding: isMobile ? '1rem' : '1.25rem 1.5rem',
                background: 'var(--secondary)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: isMobile ? '0.75rem' : '1rem',
                alignItems: 'flex-end'
            }}>
                <div style={{
                    flex: 1,
                    position: 'relative'
                }}>
                    <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            // Auto-resize only after 4 lines (approximately 80px)
                            const scrollHeight = e.target.scrollHeight;
                            if (scrollHeight > 80) {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(scrollHeight, 120) + 'px';
                                e.target.style.overflowY = 'auto';
                            } else {
                                e.target.style.height = '48px';
                                e.target.style.overflowY = 'hidden';
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        placeholder="Mesajınızı yazın..."
                        rows={1}
                        style={{
                            width: '100%',
                            padding: '0.85rem 1.25rem',
                            borderRadius: '16px',
                            border: '2px solid transparent',
                            background: 'var(--background)',
                            color: 'var(--text)',
                            fontSize: '0.95rem',
                            outline: 'none',
                            resize: 'none',
                            minHeight: '48px',
                            maxHeight: '120px',
                            lineHeight: '1.4',
                            transition: 'border 0.2s, box-shadow 0.2s',
                            overflowY: 'hidden'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#f97316';
                            e.target.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'transparent';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    style={{
                        width: isMobile ? '48px' : '56px',
                        height: isMobile ? '48px' : '56px',
                        borderRadius: '16px',
                        border: 'none',
                        background: newMessage.trim() && !sending
                            ? 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)'
                            : 'var(--border)',
                        color: 'white',
                        fontSize: '1.25rem',
                        cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        boxShadow: newMessage.trim() && !sending
                            ? '0 6px 20px rgba(249, 115, 22, 0.35)'
                            : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                        if (newMessage.trim() && !sending) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.45)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = newMessage.trim() && !sending
                            ? '0 6px 20px rgba(249, 115, 22, 0.35)'
                            : 'none';
                    }}
                >
                    {sending ? (
                        <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: 'white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    )}
                </button>
            </form>

            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
