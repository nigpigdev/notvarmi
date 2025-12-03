'use client';

import React from 'react';

export default function LoadingScreen() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'var(--background)',
            backgroundImage: 'radial-gradient(circle at center, var(--secondary) 0%, var(--background) 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'opacity 0.5s ease-out'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem'
            }}>
                {/* Logo */}
                <span className="logo-text" style={{ color: 'white' }}>Notvarmı</span>

                {/* Modern Bouncing Dots Loader */}
                <div className="dots-loader">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>

            <style jsx>{`
                /* Logo Styling */
                .logo-text {
                    font-family: var(--font-pacifico);
                    font-size: 4rem;
                    background: var(--primary-gradient);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-weight: bold;
                    letter-spacing: 1px;
                    display: inline-block;
                    position: relative;
                    /* Fallback for when gradient hasn't loaded or supported */
                    color: white; 
                }

                .dots-loader {
                    display: flex;
                    gap: 0.8rem;
                }

                .dots-loader span {
                    width: 12px;
                    height: 12px;
                    background: var(--primary);
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }

                .dots-loader span:nth-child(1) {
                    animation-delay: -0.32s;
                }

                .dots-loader span:nth-child(2) {
                    animation-delay: -0.16s;
                }

                @keyframes bounce {
                    0%, 80%, 100% { 
                        transform: scale(0);
                        opacity: 0.5;
                    }
                    40% { 
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
