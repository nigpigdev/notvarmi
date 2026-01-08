'use client';

import { useTheme } from '../providers/ThemeProvider';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: '50px',
                height: '26px',
                borderRadius: '13px',
                backgroundColor: theme === 'light' ? '#dbdbdb' : '#262626',
                transition: 'background-color 0.3s ease',
            }}
            aria-label="Toggle Theme"
        >
            <div
                style={{
                    position: 'absolute',
                    top: '3px',
                    left: theme === 'light' ? '3px' : '27px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: theme === 'light' ? '#fff' : '#000',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'left 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55), background-color 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                }}
            >
                {theme === 'light' ? '☀️' : '🌙'}
            </div>
        </button>
    );
}
