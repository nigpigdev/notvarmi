'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import { useSession, signOut } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';

import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

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
                    <ThemeToggle />
                </li>
            )}
            <li>
                <Link href="/search" onClick={isMobile ? closeMobileMenu : undefined} className={styles.searchLink} title="Ara">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    {isMobile && <span>🔍 Ara</span>}
                </Link>
            </li>

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
                                <Link href="/topluluk" onClick={isMobile ? closeMobileMenu : undefined}>📢 {t.navbar.forum}</Link>
                            </li>
                            <li>
                                <Link href="/messages" onClick={isMobile ? closeMobileMenu : undefined} className={styles.messagesLink}>
                                    💬 Mesajlar
                                    {unreadMessages > 0 && (
                                        <span className={styles.unreadBadge}>
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
                                <Link href="/arsiv" onClick={isMobile ? closeMobileMenu : undefined}>📝 {t.navbar.notes}</Link>
                            </li>
                            <li>
                                <Link href="/topluluk" onClick={isMobile ? closeMobileMenu : undefined}>📢 {t.navbar.forum}</Link>
                            </li>
                            <li>
                                <Link href="/messages" onClick={isMobile ? closeMobileMenu : undefined} className={styles.messagesLink}>
                                    💬 Mesajlar
                                    {unreadMessages > 0 && (
                                        <span className={styles.unreadBadge}>
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
                                <button onClick={() => { signOut(); closeMobileMenu(); }} className={styles.logoutBtn}>
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
                    <li className={styles.mobileAppSeparator}>
                        <Link href="/app" onClick={closeMobileMenu} className={styles.mobileAppLink}>
                            📲 Mobil Uygulama
                        </Link>
                    </li>
                    <li className={styles.mobileUtilItem}>
                        <button
                            onClick={() => { toggleLanguage(); }}
                            className={styles.langBtn}
                        >
                            🌐 {language === 'tr' ? 'English' : 'Türkçe'}
                        </button>
                    </li>
                    <li className={styles.mobileUtilItem}>
                        <div className={styles.themeToggleWrapper}>
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
                    <Link href="/">
                        <span className={styles.logoText}>Notvarmı</span>
                    </Link>
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
