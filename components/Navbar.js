'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';

import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import ProductivityMenu from './ProductivityMenu';

export default function Navbar() {
    const { data: session, status } = useSession();
    const { language, toggleLanguage, t } = useLanguage();
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchUnreadMessages();
            const interval = setInterval(fetchUnreadMessages, 10000); // Check every 10 seconds
            return () => clearInterval(interval);
        }
    }, [status]);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 767);
        };
        checkMobile(); // Initial check
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close mobile menu when screen resizes to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 767) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchUnreadMessages = async () => {
        try {
            const res = await fetch('/api/messages/unread-count');
            if (res.ok) {
                const data = await res.json();
                setUnreadMessages(data.count);
            }
        } catch (error) {
            console.error('Error fetching unread messages:', error);
        }
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    // Render navigation links (reusable for both desktop and mobile)
    const renderNavLinks = (isMobile = false) => (
        <>
            {!isMobile && (
                <li>
                    <button
                        onClick={toggleLanguage}
                        style={{
                            background: 'none',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.color = 'var(--text)';
                        }}
                    >
                        🌐 {language === 'tr' ? 'TR' : 'EN'}
                    </button>
                </li>
            )}
            {!isMobile && (
                <li>
                    <ThemeToggle />
                </li>
            )}
            <li>
                <Link href="/search" onClick={isMobile ? closeMobileMenu : undefined} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isMobile ? 'flex-start' : 'center',
                    color: 'var(--text)',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    border: '1px solid transparent'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--secondary)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                    }}
                    title="Ara">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: isMobile ? '8px' : '0' }}>
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    {isMobile && <span>🔍 Ara</span>}
                </Link>
            </li>
            {status === 'authenticated' && !isMobile && (
                <li>
                    <ProductivityMenu />
                </li>
            )}
            {status === 'authenticated' ? (
                <>
                    {session?.user?.role && (session.user.role === 'ADMIN' || session.user.role === 'POWERUSER') ? (
                        <>
                            <li>
                                <Link href="/admin" onClick={isMobile ? closeMobileMenu : undefined}>
                                    🛡️ Admin Paneli
                                </Link>
                            </li>
                            <li>
                                <Link href="/forum" onClick={isMobile ? closeMobileMenu : undefined}>📢 {t.navbar.forum}</Link>
                            </li>
                            <li>
                                <Link href="/messages" onClick={isMobile ? closeMobileMenu : undefined} style={{ position: 'relative' }}>
                                    💬 Mesajlar
                                    {unreadMessages > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-12px',
                                            background: '#ff4444',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '18px',
                                            height: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            border: '2px solid var(--background)'
                                        }}>
                                            {unreadMessages > 9 ? '9+' : unreadMessages}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link href="/courses" onClick={isMobile ? closeMobileMenu : undefined}>📚 {t.navbar.courses}</Link>
                            </li>
                            <li>
                                <Link href="/notes" onClick={isMobile ? closeMobileMenu : undefined}>📝 {t.navbar.notes}</Link>
                            </li>
                            <li>
                                <Link href="/forum" onClick={isMobile ? closeMobileMenu : undefined}>📢 {t.navbar.forum}</Link>
                            </li>
                            <li>
                                <Link href="/messages" onClick={isMobile ? closeMobileMenu : undefined} style={{ position: 'relative' }}>
                                    💬 Mesajlar
                                    {unreadMessages > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-12px',
                                            background: '#ff4444',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '18px',
                                            height: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            border: '2px solid var(--background)'
                                        }}>
                                            {unreadMessages > 9 ? '9+' : unreadMessages}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        </>
                    )}
                    {!isMobile && (
                        <li>
                            <UserMenu user={session.user} />
                        </li>
                    )}
                    {isMobile && (
                        <>
                            <li>
                                <Link href={`/profile/${session?.user?.username}`} onClick={closeMobileMenu}>
                                    👤 Profil
                                </Link>
                            </li>
                            <li>
                                <Link href="/settings" onClick={closeMobileMenu}>
                                    ⚙️ Ayarlar
                                </Link>
                            </li>
                            <li>
                                <ProductivityMenu isMobile={true} onOpen={closeMobileMenu} />
                            </li>
                            <li>
                                <button onClick={() => { signOut(); closeMobileMenu(); }} style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '1rem',
                                    borderRadius: '8px'
                                }}>
                                    🚪 {t.navbar.logout || 'Çıkış Yap'}
                                </button>
                            </li>
                        </>
                    )}
                </>
            ) : (
                <>
                    {!isMobile && (
                        <>
                            <li>
                                <Link href="/login" onClick={closeMobileMenu} className={styles.loginBtn}>
                                    {t.navbar.login}
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className={styles.registerBtn} onClick={closeMobileMenu}>
                                    {t.navbar.register}
                                </Link>
                            </li>
                        </>
                    )}
                    {isMobile && (
                        <>
                            <li>
                                <Link href="/login" onClick={closeMobileMenu} className={styles.mobileLoginBtn}>
                                    🔑 {t.navbar.login}
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className={styles.mobileRegisterBtn} onClick={closeMobileMenu}>
                                    ✨ {t.navbar.register}
                                </Link>
                            </li>
                        </>
                    )}
                </>
            )}
            {isMobile && (
                <>
                    <li style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <button
                            onClick={() => { toggleLanguage(); }}
                            style={{
                                background: 'none',
                                border: '1px solid var(--border)',
                                color: 'var(--text)',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '600',
                                width: '100%',
                                textAlign: 'center'
                            }}
                        >
                            🌐 {language === 'tr' ? 'English' : 'Türkçe'}
                        </button>
                    </li>
                    <li style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
                            <ThemeToggle />
                        </div>
                    </li>
                </>
            )}
        </>
    );

    return (
        <>
            <nav className={styles.navbar}>
                <div className={styles.logo}>
                    <Link href="/" style={{
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 'bold',
                        fontFamily: 'var(--font-pacifico)',
                        fontSize: '2.2rem',
                        letterSpacing: '1px',
                        paddingBottom: '0.5rem'
                    }}>Notvarmı</Link>
                </div>

                {/* Desktop Navigation */}
                <ul className={styles.navLinks}>
                    {renderNavLinks(false)}
                </ul>

                {/* Mobile Hamburger Button */}
                <button
                    className={`${styles.hamburger} ${mobileMenuOpen ? styles.active : ''}`}
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.active : ''}`}
                onClick={closeMobileMenu}
            ></div>

            {/* Mobile Menu Drawer */}
            <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.active : ''}`}>
                <ul className={styles.mobileMenuItems}>
                    {renderNavLinks(true)}
                </ul>
            </div>
        </>
    );
}
