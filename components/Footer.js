'use client';

import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer-glass">
            <div className="footer-content">
                <div className="footer-left">
                    <span className="footer-logo">Notvarmı</span>
                    <p className="footer-tagline">Üniversite hayatını kolaylaştıran öğrenci platformu.</p>
                </div>

                <div className="footer-links">
                    <div className="footer-group">
                        <h4>Platform</h4>
                        <Link href="/topluluk">Topluluk</Link>
                        <Link href="/courses">Dersler</Link>
                        <Link href="/arsiv">Not Arşivi</Link>
                    </div>
                    <div className="footer-group">
                        <h4>Kurumsal</h4>
                        <Link href="/privacy">Gizlilik Politikası</Link>
                        <Link href="/terms">Kullanım Koşulları</Link>
                        <Link href="/contact">İletişim</Link>
                    </div>
                    <div className="footer-group">
                        <h4>Uygulama</h4>
                        <Link href="/app" className="app-badge">📲 Mobil Uygulama</Link>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Notvarmı. Tüm hakları saklıdır.</p>
                <div className="social-links">
                    <span className="social-icon">Instagram</span>
                    <span className="social-icon">Twitter</span>
                    <span className="social-icon">Discord</span>
                </div>
            </div>

            <style jsx>{`
                .footer-glass {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    padding: 4rem 5% 2rem;
                    margin-top: 4rem;
                }

                .footer-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 4rem;
                    margin-bottom: 3rem;
                }

                .footer-left {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .footer-logo {
                    font-size: 1.75rem;
                    font-weight: 800;
                    font-family: var(--font-pacifico);
                    background: var(--primary-gradient);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .footer-tagline {
                    color: var(--text-secondary);
                    font-size: 1rem;
                    max-width: 300px;
                    line-height: 1.6;
                }

                .footer-links {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2rem;
                }

                .footer-group h4 {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text);
                    margin: 0 0 1.5rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .footer-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .footer-group :global(a) {
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-size: 0.95rem;
                    transition: all 0.3s ease;
                }

                .footer-group :global(a:hover) {
                    color: #f97316;
                    transform: translateX(4px);
                }

                .app-badge {
                    padding: 0.5rem 1rem;
                    background: rgba(249, 115, 22, 0.1);
                    border: 1px solid rgba(249, 115, 22, 0.2);
                    border-radius: 10px;
                    color: #f97316 !important;
                    font-weight: 700;
                    display: inline-block;
                    margin-top: 0.5rem;
                }

                .footer-bottom {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding-top: 2rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                .social-links {
                    display: flex;
                    gap: 1.5rem;
                }

                .social-icon {
                    cursor: pointer;
                    transition: color 0.3s ease;
                }

                .social-icon:hover {
                    color: #f97316;
                }

                @media (max-width: 767px) {
                    .footer-content {
                        grid-template-columns: 1fr;
                        gap: 3rem;
                    }

                    .footer-links {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }

                    .footer-bottom {
                        flex-direction: column-reverse;
                        gap: 1.5rem;
                        text-align: center;
                    }

                    .footer-glass {
                        padding: 3rem 1.25rem 2rem;
                    }
                }
            `}</style>
        </footer>
    );
}
