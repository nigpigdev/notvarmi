'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';

export default function Hero() {
    const { status } = useSession();
    const [isMobile, setIsMobile] = useState(false);
    const [stats, setStats] = useState({ posts: 0, users: 0, files: 0 });
    const [displayStats, setDisplayStats] = useState({ posts: 0, users: 0, files: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const [activeCard, setActiveCard] = useState(0);
    const [activeUsers, setActiveUsers] = useState(0);
    const activeUsersInitialized = useRef(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 767);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        setIsVisible(true);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-rotate showcase cards
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveCard(prev => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Fetch live stats and boost them
    useEffect(() => {
        // Set initial fallback values immediately (active = 25% of users)
        // Using 250 as fallback to match minimum boosted value from API
        const fallbackUsers = 250;
        const fallbackActive = Math.floor(fallbackUsers * 0.25); // 62
        setStats({ posts: 150, users: fallbackUsers, files: 80 });
        if (!activeUsersInitialized.current) {
            setActiveUsers(fallbackActive);
            activeUsersInitialized.current = true;
        }

        const fetchStats = async () => {
            try {
                const res = await fetch('/api/forum/posts');
                if (res.ok) {
                    const data = await res.json();
                    const posts = data.posts || [];
                    let fileCount = 0;
                    posts.forEach(post => {
                        try {
                            if (post.fileUrls) {
                                const urls = JSON.parse(post.fileUrls);
                                fileCount += urls.length;
                            }
                        } catch (e) { }
                    });
                    const boostedPosts = Math.max((data.total || posts.length) * 3, 150);
                    const boostedFiles = Math.max(fileCount * 4, 80);
                    setStats(prev => ({ ...prev, posts: boostedPosts, files: boostedFiles }));
                }

                const usersRes = await fetch('/api/admin/stats');
                if (usersRes.ok) {
                    const userData = await usersRes.json();
                    const boostedUsers = Math.max((userData.totalUsers || 0) * 5, 250);
                    setStats(prev => ({ ...prev, users: boostedUsers }));

                    // Always sync active users to 25% of total users
                    const newActive = Math.floor(boostedUsers * 0.25);
                    setActiveUsers(newActive);
                }
            } catch (error) {
                // Fallbacks are already set, do nothing
            }
        };

        fetchStats();
    }, []);

    // Subtle active user count changes - very rare (every 30-60 seconds)
    useEffect(() => {
        if (!activeUsersInitialized.current) return;

        const updateActiveUsers = () => {
            setActiveUsers(prev => {
                // Small change: +/-1 to +/-3
                const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
                const newValue = prev + change;
                // Keep within reasonable bounds
                const nextVal = Math.max(Math.floor(stats.users * 0.15), Math.min(newValue, Math.floor(stats.users * 0.35)));

                // Trigger simulation heartbeat
                fetch('/api/cron/simulate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ activeUsers: nextVal })
                }).catch(() => { }); // Ignore errors silently

                return nextVal;
            });
        };

        // Update every 30-60 seconds randomly
        const interval = setInterval(updateActiveUsers, 30000 + Math.random() * 30000);
        return () => clearInterval(interval);
    }, [stats.users]);

    // Animate counters
    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setDisplayStats({
                posts: Math.floor(stats.posts * easeOut),
                users: Math.floor(stats.users * easeOut),
                files: Math.floor(stats.files * easeOut)
            });

            if (currentStep >= steps) {
                clearInterval(timer);
                setDisplayStats(stats);
            }
        }, stepDuration);

        return () => clearInterval(timer);
    }, [stats]);

    const showcaseCards = [
        { icon: '💬', title: 'Soru Sor', desc: 'Anlamadığın konuları öğren', color: '#f97316' },
        { icon: '📚', title: 'Not Paylaş', desc: 'Bilgini arkadaşlarınla paylaş', color: '#ec4899' },
        { icon: '📅', title: 'Sınav Takibi', desc: 'Hiçbir sınavı kaçırma', color: '#fbbf24' }
    ];

    return (
        <section className={`hero-section ${isVisible ? 'visible' : ''}`}>
            <div className="hero-container">
                <div className="hero-content">
                    <div className="hero-badge">
                        ✨ Notvarmı v2.1 yayında!
                    </div>
                    <h1 className="hero-title">
                        Notvarmı ile <br />
                        <span className="hero-title-gradient">Bağlantıda Kal.</span>
                    </h1>
                    <p className="hero-description">
                        Üniversite hayatını kolaylaştır. Notlarını paylaş, sorularını sor ve sınavlarına hazırlan. Tamamen ücretsiz ve öğrenci odaklı.
                    </p>

                    <div className="hero-buttons">
                        {status === 'authenticated' ? (
                            <>
                                <Link href="/topluluk">
                                    <button className="hero-btn-primary">
                                        🚀 Topluluğa Git
                                    </button>
                                </Link>
                                <Link href="/courses">
                                    <button className="hero-btn-secondary">
                                        📚 Dersleri Gör
                                    </button>
                                </Link>
                                <Link href="/app">
                                    <button className="hero-btn-app">
                                        📲 Uygulamayı İndir
                                    </button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/register">
                                    <button className="hero-btn-primary">
                                        ✨ Hemen Başla
                                    </button>
                                </Link>
                                <Link href="/topluluk">
                                    <button className="hero-btn-secondary">
                                        Keşfet
                                    </button>
                                </Link>
                                <Link href="/app">
                                    <button className="hero-btn-app">
                                        📲 Uygulamayı İndir
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="hero-stats-glass">
                        <div className="glass-stat">
                            <span className="glass-num">{displayStats.posts}+</span>
                            <span className="glass-label">Gönderi</span>
                        </div>
                        <div className="glass-stat">
                            <span className="glass-num">{displayStats.users}+</span>
                            <span className="glass-label">Kullanıcı</span>
                        </div>
                        <div className="glass-stat">
                            <span className="glass-num">{displayStats.files}+</span>
                            <span className="glass-label">Dosya</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="floating-cards-wrapper">
                        {showcaseCards.map((card, index) => (
                            <div
                                key={index}
                                className={`floating-card card-${index + 1} ${activeCard === index ? 'active' : ''}`}
                                style={{ '--accent': card.color }}
                            >
                                <div className="card-inner">
                                    <span className="card-icon">{card.icon}</span>
                                    <div className="card-text">
                                        <h4>{card.title}</h4>
                                        <p>{card.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hero-section {
                    position: relative;
                    min-height: calc(100vh - 80px);
                    display: flex;
                    align-items: center;
                    padding: 4rem 5%;
                    overflow: hidden;
                    opacity: 1;
                }

                .hero-section::before {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                    pointer-events: none;
                    background:
                        radial-gradient(ellipse 80% 50% at 20% 40%, rgba(249, 115, 22, 0.15), transparent),
                        radial-gradient(ellipse 60% 50% at 80% 20%, rgba(236, 72, 153, 0.12), transparent),
                        radial-gradient(ellipse 50% 40% at 60% 80%, rgba(59, 130, 246, 0.08), transparent);
                    filter: blur(60px);
                    opacity: 0.7;
                }

                [data-theme='dark'] .hero-section::before {
                    background:
                        radial-gradient(ellipse 80% 50% at 20% 40%, rgba(249, 115, 22, 0.2), transparent),
                        radial-gradient(ellipse 60% 50% at 80% 20%, rgba(236, 72, 153, 0.15), transparent),
                        radial-gradient(ellipse 50% 40% at 60% 80%, rgba(59, 130, 246, 0.1), transparent);
                    opacity: 0.5;
                }

                .hero-container {
                    width: 100%;
                    max-width: 1400px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 1.2fr 1fr;
                    gap: 4rem;
                    align-items: center;
                    z-index: 2;
                }

                .hero-badge {
                    display: inline-block;
                    padding: 0.6rem 1.25rem;
                    background: rgba(249, 115, 22, 0.1);
                    border: 1px solid rgba(249, 115, 22, 0.2);
                    border-radius: 100px;
                    color: #f97316;
                    font-weight: 700;
                    font-size: 0.85rem;
                    margin-bottom: 2rem;
                    backdrop-filter: blur(10px);
                    animation: fadeInUp 0.8s ease backwards;
                }

                .hero-title {
                    font-size: clamp(3rem, 6vw, 4.5rem);
                    line-height: 1.1;
                    font-weight: 900;
                    color: var(--text);
                    letter-spacing: -2px;
                    margin-bottom: 1.5rem;
                    animation: fadeInUp 0.8s ease 0.1s both;
                }

                .hero-title-gradient {
                    background: linear-gradient(
                        90deg, 
                        #f97316 0%, 
                        #fb923c 15%,
                        #ec4899 35%, 
                        #d946ef 50%,
                        #8b5cf6 65%,
                        #3b82f6 85%, 
                        #f97316 100%
                    );
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    background-size: 300% 100%;
                    animation: gradient-flow 12s ease-in-out infinite;
                }

                @keyframes gradient-flow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .hero-description {
                    font-size: 1.25rem;
                    color: var(--text-secondary);
                    max-width: 580px;
                    line-height: 1.7;
                    margin-bottom: 3rem;
                    animation: fadeInUp 0.8s ease 0.2s both;
                }

                .hero-buttons {
                    display: flex;
                    gap: 1.25rem;
                    margin-bottom: 4rem;
                    animation: fadeInUp 0.8s ease 0.3s both;
                }

                .hero-btn-primary {
                    padding: 1.15rem 2.5rem;
                    background: var(--primary-gradient);
                    color: white;
                    border: none;
                    border-radius: 18px;
                    font-weight: 800;
                    font-size: 1.05rem;
                    box-shadow: 0 15px 35px rgba(249, 115, 22, 0.3);
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .hero-btn-primary:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 50px rgba(249, 115, 22, 0.45);
                }

                .hero-btn-secondary {
                    padding: 1.15rem 2.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--border);
                    color: var(--text);
                    border-radius: 18px;
                    font-weight: 700;
                    font-size: 1.05rem;
                    cursor: pointer;
                    transition: all 0.4s ease;
                }

                .hero-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: var(--text);
                }

                .hero-btn-app {
                    padding: 1.15rem 2rem;
                    background: rgba(249, 115, 22, 0.08);
                    border: 1.5px solid #f97316;
                    color: #f97316;
                    border-radius: 18px;
                    font-weight: 700;
                    font-size: 1.05rem;
                    cursor: pointer;
                    transition: all 0.4s ease;
                }

                .hero-btn-app:hover {
                    background: rgba(249, 115, 22, 0.15);
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(249, 115, 22, 0.2);
                }

                .hero-stats-glass {
                    display: flex;
                    gap: 3rem;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    width: fit-content;
                    backdrop-filter: blur(20px);
                    animation: fadeInUp 0.8s ease 0.4s both;
                }

                .glass-stat {
                    display: flex;
                    flex-direction: column;
                }

                .glass-num {
                    font-size: 2rem;
                    font-weight: 900;
                    color: var(--text);
                }

                .glass-label {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                /* Visual Half */
                .hero-visual {
                    position: relative;
                    height: 600px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 1.5s ease 0.5s both;
                }

                .floating-cards-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .floating-card {
                    position: absolute;
                    width: 280px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(30px);
                    border-radius: 24px;
                    padding: 1.5rem;
                    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                }

                .card-inner {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                }

                .card-icon {
                    font-size: 2.25rem;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 18px;
                    box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05);
                }

                .card-text h4 {
                    margin: 0 0 0.25rem;
                    font-size: 1.1rem;
                    font-weight: 700;
                }

                .card-text p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }

                .card-1 { top: 10%; right: 0; z-index: 3; animation: float-icon 6s infinite ease-in-out; }
                .card-2 { top: 40%; left: 0; z-index: 2; animation: float-icon 7s infinite ease-in-out -1s; }
                .card-3 { bottom: 10%; right: 10%; z-index: 1; animation: float-icon 8s infinite ease-in-out -2s; }

                .floating-card.active {
                    transform: scale(1.1) translateY(-10px);
                    border-color: var(--accent);
                    background: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
                }

                @keyframes float-icon {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }

                .activity-indicator {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.2);
                    padding: 0.75rem 1.5rem;
                    border-radius: 100px;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #22c55e;
                    font-size: 0.95rem;
                    backdrop-filter: blur(10px);
                }

                .pulse-dot {
                    width: 10px;
                    height: 10px;
                    background: #22c55e;
                    border-radius: 50%;
                    box-shadow: 0 0 15px #22c55e;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                /* Responsive */
                @media (max-width: 1100px) {
                    .hero-container {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }

                    .hero-content {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }

                    .hero-description {
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .hero-visual {
                        height: 500px;
                        margin-top: 2rem;
                    }

                    .floating-card {
                        width: 240px;
                    }
                }

                @media (max-width: 767px) {
                    .hero-section {
                        padding: 2rem 1.25rem;
                    }

                    .hero-title {
                        font-size: 2.75rem;
                        letter-spacing: -1px;
                    }

                    .hero-buttons {
                        flex-direction: column;
                        width: 100%;
                    }

                    .hero-stats-glass {
                        gap: 1.5rem;
                        padding: 1.5rem;
                        width: 100%;
                        justify-content: center;
                    }

                    .glass-num {
                        font-size: 1.5rem;
                    }

                    .hero-visual {
                        display: none;
                    }
                }
            `}</style>
        </section>
    );
}

