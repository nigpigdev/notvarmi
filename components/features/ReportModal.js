'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ReportModal({ isOpen, onClose, type, id }) {
    const { data: session } = useSession();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!session) {
            alert('Raporlamak için giriş yapmalısınız.');
            return;
        }

        if (!reason) {
            alert('Lütfen bir neden belirtin.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/forum/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason,
                    postId: type === 'post' ? id : undefined,
                    replyId: type === 'reply' ? id : undefined
                })
            });

            if (res.ok) {
                alert('Raporunuz iletildi. Teşekkürler.');
                onClose();
                setReason('');
            } else {
                const error = await res.json();
                alert(error.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Report error:', error);
            alert('Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                background: 'var(--secondary)',
                padding: '2rem',
                borderRadius: '16px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border)'
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ color: 'var(--text)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                    ⚠️ İçeriği Raporla
                </h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', color: 'var(--text)', marginBottom: '0.5rem' }}>
                            Rapor Nedeni:
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--background)',
                                color: 'var(--text)',
                                fontSize: '1rem'
                            }}
                            required
                        >
                            <option value="">Seçiniz...</option>
                            <option value="SPAM">Spam / Reklam</option>
                            <option value="HARASSMENT">Taciz / Hakaret</option>
                            <option value="MISINFORMATION">Yanıltıcı Bilgi</option>
                            <option value="INAPPROPRIATE">Uygunsuz İçerik</option>
                            <option value="OTHER">Diğer</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '0.8rem 1.5rem',
                                background: 'transparent',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.8rem 1.5rem',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            {loading ? 'Gönderiliyor...' : 'Raporla'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
