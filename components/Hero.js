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
            {/* Static Floating Particles */}
            <div className="hero-particles">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="particle" style={{
                        '--delay': `${i * 1}s`,
                        '--x': `${10 + Math.random() * 80}%`,
                        '--size': `${4 + Math.random() * 4}px`,
                        '--duration': `${25 + Math.random() * 15}s`
                    }} />
                ))}
            </div>

            <div className="hero-content">
                <h1 className="hero-title">
                    Notvarmı ile <br />
                    <span className="hero-title-gradient">Bağlantıda Kal.</span>
                </h1>
                <p className="hero-description">
                    Üniversite hayatını kolaylaştır. Notlarını paylaş, sorularını sor ve sınavlarına hazırlan.
                </p>

                {/* Live Stats Counter */}
                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-number">{displayStats.posts}+</span>
                        <span className="stat-label">Gönderi</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">{displayStats.users}+</span>
                        <span className="stat-label">Kullanıcı</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">{displayStats.files}+</span>
                        <span className="stat-label">Dosya</span>
                    </div>
                </div>

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
                        </>
                    )}
                </div>
            </div>

            {/* Interactive Showcase Cards */}
            <div className="hero-showcase">
                <div className="showcase-container">
                    {showcaseCards.map((card, index) => (
                        <div
                            key={index}
                            className={`showcase-card ${activeCard === index ? 'active' : ''}`}
                            onClick={() => setActiveCard(index)}
                            style={{ '--card-color': card.color }}
                        >
                            <div className="showcase-icon">{card.icon}</div>
                            <div className="showcase-content">
                                <h3>{card.title}</h3>
                                <p>{card.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Progress Indicators */}
                <div className="showcase-indicators">
                    {showcaseCards.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${activeCard === index ? 'active' : ''}`}
                            onClick={() => setActiveCard(index)}
                        />
                    ))}
                </div>

                {/* Live Activity Feed - Stable count */}
                <div className="live-feed">
                    <div className="live-dot"></div>
                    <span>{activeUsers} aktif kullanıcı</span>
                </div>
            </div>

            <style jsx>{`
                .hero-section {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 5rem 0;
                    margin-bottom: 3rem;
                    position: relative;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateY(30px);
                    transition: opacity 0.8s ease, transform 0.8s ease;
                }

                .hero-section.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .hero-particles {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    overflow: hidden;
                }

                .particle {
                    position: absolute;
                    width: var(--size);
                    height: var(--size);
                    background: linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(236, 72, 153, 0.3));
                    border-radius: 50%;
                    left: var(--x);
                    top: 100%;
                    animation: floatUp var(--duration) linear infinite;
                    animation-delay: var(--delay);
                }

                @keyframes floatUp {
                    0% {
                        transform: translateY(0);
                        opacity: 0;
                    }
                    5% {
                        opacity: 0.5;
                    }
                    95% {
                        opacity: 0.5;
                    }
                    100% {
                        transform: translateY(-100vh);
                        opacity: 0;
                    }
                }

                .hero-content {
                    flex: 1;
                    padding-right: 4rem;
                    z-index: 1;
                }

                .hero-title {
                    font-size: 3.5rem;
                    margin-bottom: 1.25rem;
                    color: var(--text);
                    line-height: 1.15;
                    font-weight: 800;
                    letter-spacing: -1px;
                    animation: fadeInUp 0.8s ease 0.3s both;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .hero-title-gradient {
                    background: linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%);
                    background-size: 200% 200%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    display: inline-block;
                    animation: gradientShift 4s ease infinite;
                }

                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .hero-description {
                    font-size: 1.2rem;
                    color: var(--text-secondary);
                    margin-bottom: 1.75rem;
                    max-width: 500px;
                    line-height: 1.6;
                    animation: fadeInUp 0.8s ease 0.5s both;
                }

                .hero-stats {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                    padding: 1rem 1.5rem;
                    background: rgba(249, 115, 22, 0.08);
                    border: 1px solid rgba(249, 115, 22, 0.15);
                    border-radius: 16px;
                    width: fit-content;
                    animation: fadeInUp 0.8s ease 0.7s both;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .stat-number {
                    font-size: 1.6rem;
                    font-weight: 800;
                    background: var(--primary-gradient);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .stat-label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                }

                .stat-divider {
                    width: 1px;
                    height: 35px;
                    background: var(--border);
                }

                .hero-buttons {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    animation: fadeInUp 0.8s ease 0.9s both;
                }

                .hero-buttons a {
                    text-decoration: none;
                }

                .hero-btn-primary {
                    padding: 1rem 2rem;
                    background: var(--primary-gradient);
                    color: white;
                    border: none;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 1rem;
                    box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-family: inherit;
                }

                .hero-btn-primary:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 28px rgba(249, 115, 22, 0.4);
                }

                .hero-btn-secondary {
                    padding: 1rem 2rem;
                    background: var(--secondary);
                    color: var(--text);
                    border: 2px solid var(--border);
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-family: inherit;
                }

                .hero-btn-secondary:hover {
                    border-color: #f97316;
                    background: rgba(249, 115, 22, 0.1);
                }

                .hero-showcase {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                    animation: fadeInRight 1s ease 0.5s both;
                }

                @keyframes fadeInRight {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .showcase-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    width: 100%;
                    max-width: 380px;
                }

                .showcase-card {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.25rem 1.5rem;
                    background: var(--secondary);
                    border: 2px solid var(--border);
                    border-radius: 18px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }

                .showcase-card::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    width: 4px;
                    background: var(--card-color);
                    transform: scaleY(0);
                    transition: transform 0.3s ease;
                }

                .showcase-card.active {
                    border-color: var(--card-color);
                    background: linear-gradient(135deg, var(--secondary) 0%, rgba(249, 115, 22, 0.05) 100%);
                    transform: translateX(10px) scale(1.02);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }

                .showcase-card.active::before {
                    transform: scaleY(1);
                }

                .showcase-icon {
                    font-size: 2.5rem;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
                    transition: transform 0.3s ease;
                }

                .showcase-card.active .showcase-icon {
                    transform: scale(1.1);
                }

                .showcase-content h3 {
                    font-size: 1.1rem;
                    color: var(--text);
                    margin: 0 0 0.25rem;
                    font-weight: 700;
                }

                .showcase-content p {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin: 0;
                }

                .showcase-indicators {
                    display: flex;
                    gap: 0.5rem;
                }

                .indicator {
                    width: 32px;
                    height: 4px;
                    border-radius: 2px;
                    background: var(--border);
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .indicator.active {
                    background: var(--primary-gradient);
                    width: 48px;
                }

                .live-feed {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.2rem;
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.2);
                    border-radius: 50px;
                    font-size: 0.85rem;
                    color: #22c55e;
                    font-weight: 500;
                }

                .live-dot {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                }

                /* Mobile Responsive */
                @media (max-width: 767px) {
                    .hero-section {
                        flex-direction: column;
                        padding: 3rem 0 2rem;
                        margin-bottom: 2rem;
                    }

                    .hero-content {
                        padding-right: 0;
                        text-align: center;
                        margin-bottom: 2.5rem;
                    }

                    .hero-title {
                        font-size: 2.25rem;
                    }

                    .hero-description {
                        font-size: 1rem;
                        max-width: 100%;
                        margin-bottom: 1.5rem;
                    }

                    .hero-stats {
                        gap: 1rem;
                        padding: 0.9rem 1.25rem;
                        margin: 0 auto 1.5rem;
                    }

                    .stat-number {
                        font-size: 1.3rem;
                    }

                    .stat-label {
                        font-size: 0.7rem;
                    }

                    .hero-buttons {
                        justify-content: center;
                    }

                    .hero-btn-primary, .hero-btn-secondary {
                        padding: 0.9rem 1.5rem;
                        font-size: 0.95rem;
                    }

                    .hero-showcase {
                        width: 100%;
                    }

                    .showcase-container {
                        max-width: 100%;
                    }

                    .showcase-card {
                        padding: 1rem 1.25rem;
                    }

                    .showcase-card.active {
                        transform: translateX(5px) scale(1.01);
                    }

                    .showcase-icon {
                        font-size: 2rem;
                    }

                    .showcase-content h3 {
                        font-size: 1rem;
                    }

                    .showcase-content p {
                        font-size: 0.8rem;
                    }

                    .hero-particles {
                        opacity: 0.5;
                    }
                }

                @media (max-width: 360px) {
                    .hero-title {
                        font-size: 1.9rem;
                    }

                    .hero-btn-primary, .hero-btn-secondary {
                        padding: 0.8rem 1.25rem;
                        font-size: 0.9rem;
                        flex: 1;
                    }

                    .hero-stats {
                        gap: 0.75rem;
                        padding: 0.75rem 1rem;
                    }

                    .stat-number {
                        font-size: 1.1rem;
                    }
                }
            `}</style>
        </section>
    );
}
