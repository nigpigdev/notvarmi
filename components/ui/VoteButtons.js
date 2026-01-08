'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function VoteButtons({ type, id, initialVotes }) {
    const { data: session } = useSession();
    const [votes, setVotes] = useState(initialVotes || []);
    const [loading, setLoading] = useState(false);

    const userId = session?.user?.id;

    // Calculate counts
    const likes = votes.filter(v => v.type === 'LIKE').length;
    const dislikes = votes.filter(v => v.type === 'DISLIKE').length;

    // Check user status
    const userVote = userId ? votes.find(v => v.userId === userId) : null;
    const userVoteType = userVote ? userVote.type : null;

    const handleVote = async (voteType) => {
        if (!session) {
            alert('Oy vermek için giriş yapmalısınız.');
            return;
        }

        if (loading) return;
        setLoading(true);

        try {
            const res = await fetch('/api/forum/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: voteType,
                    postId: type === 'post' ? id : undefined,
                    replyId: type === 'reply' ? id : undefined
                })
            });

            if (res.ok) {
                const data = await res.json();

                if (data.action === 'added') {
                    setVotes([...votes, data.vote]);
                } else if (data.action === 'removed') {
                    setVotes(votes.filter(v => v.userId !== userId));
                } else if (data.action === 'updated') {
                    setVotes(votes.map(v => v.userId === userId ? data.vote : v));
                }
            } else {
                const error = await res.json();
                alert(error.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Vote error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
                onClick={() => handleVote('LIKE')}
                disabled={loading}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: userVoteType === 'LIKE' ? '#10b981' : 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    fontWeight: userVoteType === 'LIKE' ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                }}
                title="Beğen"
            >
                {userVoteType === 'LIKE' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                )}
                <span>{likes > 0 && likes}</span>
            </button>

            <button
                onClick={() => handleVote('DISLIKE')}
                disabled={loading}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: userVoteType === 'DISLIKE' ? '#ef4444' : 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    fontWeight: userVoteType === 'DISLIKE' ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                }}
                title="Beğenme"
            >
                {userVoteType === 'DISLIKE' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                    </svg>
                )}
                <span>{dislikes > 0 && dislikes}</span>
            </button>
        </div>
    );
}
