'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Hero() {
    const { status } = useSession();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 767);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile) return; // Disable mouse effect on mobile

        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 20 - 10,
                y: (e.clientY / window.innerHeight) * 20 - 10
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isMobile]);

    return (
        <section className="hero-section">
            {/* Background Elements */}
            <div className="hero-background" style={{
                transform: isMobile ? 'none' : `translate(${mousePosition.x * -2}px, ${mousePosition.y * -2}px)`
            }} />

            <div className="hero-content">
                <h1 className="hero-title">
                    Notvarmı ile <br />
                    <span className="hero-title-gradient">Bağlantıda Kal.</span>
                </h1>
                <p className="hero-description">
                    Üniversite hayatını kolaylaştır. Notlarını paylaş, sorularını sor ve sınavlarına hazırlan. Hepsi tek bir yerde.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                    {status === 'authenticated' ? (
                        <Link href="/forum" style={{
                            padding: '1.2rem 2.5rem',
                            background: 'var(--primary-gradient)',
                            color: 'white',
                            borderRadius: '50px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            display: 'inline-block',
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 15px 30px rgba(249, 115, 22, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 25px rgba(249, 115, 22, 0.3)';
                            }}>
                            Foruma Git
                        </Link>
                    ) : (
                        <>
                            <Link href="/register" style={{
                                padding: '1.2rem 2.5rem',
                                background: 'var(--primary-gradient)',
                                color: 'white',
                                borderRadius: '50px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                display: 'inline-block',
                                textAlign: 'center',
                                cursor: 'pointer'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 15px 30px rgba(249, 115, 22, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(249, 115, 22, 0.3)';
                                }}>
                                Hemen Başla
                            </Link>
                            <Link href="/forum" style={{
                                padding: '1.2rem 2.5rem',
                                backgroundColor: 'transparent',
                                color: 'var(--text)',
                                border: '2px solid var(--border)',
                                borderRadius: '50px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                transition: 'all 0.2s ease',
                                display: 'inline-block',
                                textAlign: 'center',
                                cursor: 'pointer'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--text)';
                                    e.currentTarget.style.backgroundColor = 'var(--secondary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}>
                                Foruma Git
                            </Link>
                        </>
                    )}

                    {status === 'authenticated' && (
                        <Link href="/courses" style={{
                            padding: '1.2rem 2.5rem',
                            backgroundColor: 'transparent',
                            color: 'var(--text)',
                            border: '2px solid var(--border)',
                            borderRadius: '50px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            transition: 'all 0.2s ease',
                            display: 'inline-block',
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--text)';
                                e.currentTarget.style.backgroundColor = 'var(--secondary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}>
                            Dersleri Gör
                        </Link>
                    )}
                </div>
            </div>

            <div className="hero-card-wrapper">
                {/* 3D Floating Card Effect */}
                <div className="hero-card" style={{
                    transform: isMobile ? 'none' : `rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`
                }}>
                    {/* Decorative Elements inside card */}
                    <div className="hero-card-decoration" />

                    <div className="hero-card-emoji">
                        🚀
                    </div>
                    <h3 className="hero-card-title">
                        Geleceğini İnşa Et
                    </h3>
                    <p className="hero-card-text">
                        Notların, arkadaşların ve kariyerin burada başlıyor.
                    </p>

                    {/* Floating badges */}
                    <div className="hero-badge hero-badge-1">
                        📚 500+ Not
                    </div>
                    <div className="hero-badge hero-badge-2">
                        👥 Öğrenci Topluluğu
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hero-section {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6rem 0;
                    margin-bottom: 4rem;
                    position: relative;
                    overflow: hidden;
                }

                .hero-background {
                    display: none;
                }

                .hero-content {
                    flex: 1;
                    padding-right: 4rem;
                    z-index: 1;
                }

                .hero-title {
                    font-size: 4rem;
                    margin-bottom: 1.5rem;
                    color: var(--text);
                    line-height: 1.1;
                    font-weight: 800;
                    letter-spacing: -1px;
                }

                .hero-title-gradient {
                    background: linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    display: inline-block;
                }

                .hero-description {
                    font-size: 1.3rem;
                    color: var(--text-secondary);
                    margin-bottom: 3rem;
                    max-width: 550px;
                    line-height: 1.6;
                }

                .hero-buttons {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .hero-button {
                    padding: 1.2rem 2.5rem;
                    border-radius: 50px;
                    text-decoration: none !important;
                    font-weight: bold;
                    font-size: 1.1rem;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    display: inline-block;
                    text-align: center;
                    cursor: pointer;
                }

                .hero-button-primary {
                    background: var(--primary-gradient);
                    color: white !important;
                    box-shadow: 0 10px 25px rgba(249, 115, 22, 0.3);
                }

                .hero-button-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(249, 115, 22, 0.4);
                    color: white !important;
                }

                .hero-button-secondary {
                    background-color: transparent;
                    color: var(--text) !important;
                    border: 2px solid var(--border);
                }

                .hero-button-secondary:hover {
                    border-color: var(--text);
                    background-color: var(--secondary);
                    color: var(--text) !important;
                }

                .hero-card-wrapper {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    position: relative;
                    perspective: 1000px;
                }

                .hero-card {
                    width: 500px;
                    height: 400px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                    backdrop-filter: blur(20px);
                    border-radius: 30px;
                    border: 1px solid rgba(255,255,255,0.2);
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.1s ease-out;
                    position: relative;
                    overflow: hidden;
                }

                .hero-card-decoration {
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 60%);
                    transform: rotate(45deg);
                }

                .hero-card-emoji {
                    font-size: 5rem;
                    margin-bottom: 1rem;
                    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
                    animation: float 6s ease-in-out infinite;
                }

                .hero-card-title {
                    font-size: 2rem;
                    color: var(--text);
                    margin-bottom: 0.5rem;
                    font-family: var(--font-pacifico);
                }

                .hero-card-text {
                    color: var(--text-secondary);
                    text-align: center;
                    max-width: 80%;
                    font-size: 1.1rem;
                }

                .hero-badge {
                    position: absolute;
                    background: rgba(255,255,255,0.9);
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    color: #333;
                }

                .hero-badge-1 {
                    top: 20px;
                    right: 20px;
                    animation: float 5s ease-in-out infinite 1s;
                }

                .hero-badge-2 {
                    bottom: 30px;
                    left: 20px;
                    animation: float 7s ease-in-out infinite 0.5s;
                }

                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }

                /* Mobile Responsive Styles */
                @media (max-width: 767px) {
                    .hero-section {
                        flex-direction: column;
                        padding: 3rem 0 2rem;
                        margin-bottom: 2rem;
                    }

                    .hero-content {
                        padding-right: 0;
                        text-align: center;
                        margin-bottom: 2rem;
                    }

                    .hero-title {
                        font-size: 2.5rem;
                    }

                    .hero-description {
                        font-size: 1.1rem;
                        margin-bottom: 2rem;
                        max-width: 100%;
                    }

                    .hero-buttons {
                        justify-content: center;
                    }

                    .hero-button {
                        padding: 1rem 2rem;
                        font-size: 1rem;
                        flex: 1;
                        min-width: 140px;
                    }

                    .hero-card-wrapper {
                        width: 100%;
                        margin-top: 2rem;
                    }

                    .hero-card {
                        width: 100%;
                        max-width: 350px;
                        height: 300px;
                    }

                    .hero-card-emoji {
                        font-size: 3.5rem;
                    }

                    .hero-card-title {
                        font-size: 1.5rem;
                    }

                    .hero-card-text {
                        font-size: 0.95rem;
                    }

                    .hero-badge {
                        font-size: 0.8rem;
                        padding: 0.4rem 0.8rem;
                    }

                    .hero-background {
                        width: 400px;
                        height: 400px;
                        top: -10%;
                        right: -30%;
                    }
                }

                /* Very Small Screens (Samsung S24 and smaller) */
                @media (max-width: 360px) {
                    .hero-title {
                        font-size: 2rem;
                    }

                    .hero-description {
                        font-size: 1rem;
                    }

                    .hero-button {
                        padding: 0.9rem 1.5rem;
                        font-size: 0.95rem;
                    }
                }
            `}</style>
        </section>
    );
}
