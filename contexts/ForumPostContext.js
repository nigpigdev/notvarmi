'use client';

import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ForumPostContext = createContext();

export function ForumPostProvider({ children }) {
    const [pendingPost, setPendingPost] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const submissionTimer = useRef(null);
    const countdownTimer = useRef(null);
    const router = useRouter();

    const startSubmission = (postData) => {
        setPendingPost(postData);
        setIsPending(true);
        setCountdown(10);

        // Start countdown
        countdownTimer.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownTimer.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Start submission timer
        submissionTimer.current = setTimeout(() => {
            finalizeSubmission(postData);
        }, 10000);

        router.push('/forum');
    };

    const cancelSubmission = () => {
        if (submissionTimer.current) clearTimeout(submissionTimer.current);
        if (countdownTimer.current) clearInterval(countdownTimer.current);
        setIsPending(false);
        setCountdown(10);
        router.push('/forum/create');
    };

    const finalizeSubmission = async (data) => {
        setIsPending(false);
        if (countdownTimer.current) clearInterval(countdownTimer.current);

        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('content', data.content);
        formData.append('tags', data.tags);
        if (data.files) {
            data.files.forEach((file) => {
                formData.append('files', file);
            });
        }

        try {
            const res = await fetch('/api/forum/posts', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setPendingPost(null);
                router.refresh();
                // Auto reload page to show new content
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                console.error('Failed to create post');
                // Error handling moved to UI layer
            }
        } catch (error) {
            console.error('Error creating post:', error);
            // Error handling moved to UI layer
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (submissionTimer.current) clearTimeout(submissionTimer.current);
            if (countdownTimer.current) clearInterval(countdownTimer.current);
        };
    }, []);

    return (
        <ForumPostContext.Provider value={{
            pendingPost,
            isPending,
            countdown,
            startSubmission,
            cancelSubmission
        }}>
            {children}
            {isPending && (
                <div
                    onClick={cancelSubmission}
                    style={{
                        position: 'fixed',
                        top: '120px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                        color: 'white',
                        padding: '1rem 1.5rem',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(251, 191, 36, 0.3)',
                        zIndex: 999,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        animation: 'slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(251, 191, 36, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(-50%) translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(251, 191, 36, 0.3)';
                    }}
                >
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255, 255, 255, 0.5)',
                        borderTopColor: 'transparent',
                        animation: 'spin 1s linear infinite',
                        flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                            İçerik yükleniyor... ({countdown}s)
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.95 }}>
                            ✏️ Düzenlemek için tıklayın
                        </div>
                    </div>
                    <style jsx>{`
                        @keyframes slideDown {
                            from { transform: translate(-50%, -50px); opacity: 0; }
                            to { transform: translate(-50%, 0); opacity: 1; }
                        }
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}
        </ForumPostContext.Provider>
    );
}

export function useForumPost() {
    return useContext(ForumPostContext);
}
