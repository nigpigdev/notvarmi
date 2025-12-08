'use client';

export default function Card({ title, description, children, icon }) {
    return (
        <div style={{
            backgroundColor: 'var(--secondary)',
            border: '1px solid rgba(230, 241, 255, 0.1)',
            borderRadius: '12px',
            padding: '2rem',
            margin: '1rem 0',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px -15px rgba(2, 12, 27, 0.7)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {icon && <div style={{ marginBottom: '1rem' }}>{icon}</div>}
            {title && (
                <h3 style={{ marginTop: 0, color: 'var(--text-secondary)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {title}
                </h3>
            )}
            {description && <p style={{ color: '#8892b0', marginBottom: '1.5rem' }}>{description}</p>}
            <div style={{ marginTop: 'auto' }}>
                {children}
            </div>
        </div>
    );
}
