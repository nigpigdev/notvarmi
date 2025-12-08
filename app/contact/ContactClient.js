'use client';

export default function ContactClient() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ color: 'var(--text)', marginBottom: '1rem' }}>İletişim</h1>
            <div style={{
                backgroundColor: 'var(--secondary)',
                padding: '2rem',
                borderRadius: '16px',
                border: '1px solid var(--border)'
            }}>
                <p style={{ color: 'var(--text)', lineHeight: '1.6' }}>
                    Bizimle iletişime geçmek için aşağıdaki kanalları kullanabilirsiniz:
                </p>
                <ul style={{ marginTop: '1rem', color: 'var(--text)', paddingLeft: '1.5rem' }}>
                    <li>E-posta: info@notvarmi.com</li>
                    <li>Twitter: @notvarmi</li>
                    <li>Instagram: @notvarmi</li>
                </ul>
            </div>
        </div>
    );
}
