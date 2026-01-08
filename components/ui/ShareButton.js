'use client';

import { toast } from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ShareButton({ title, text, url }) {
    const { t } = useLanguage();

    const handleShare = async () => {
        const shareData = {
            title: title || 'Notvarmı',
            text: text || 'Bu tartışmaya göz at!',
            url: url || window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback to copy to clipboard
            try {
                // Check if clipboard API is available
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(shareData.url);
                } else {
                    // Legacy fallback for non-secure contexts
                    const textArea = document.createElement('textarea');
                    textArea.value = shareData.url;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                }
                toast.success(t.common?.copied || 'Link kopyalandı!', {
                    icon: '🔗',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            } catch (err) {
                console.error('Failed to copy:', err);
                toast.error('Kopyalama başarısız');
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            title={t.common?.share || 'Paylaş'}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.4rem',
                color: 'var(--text-secondary)',
                opacity: 0.8,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                position: 'relative'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.opacity = 1;
                e.currentTarget.style.color = 'var(--accent-blue)';
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.opacity = 0.8;
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
        </button>
    );
}
