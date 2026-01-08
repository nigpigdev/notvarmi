'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function MobileAppPage() {
    const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const ua = window.navigator.userAgent;
        setIsIOS(/iPad|iPhone|iPod/.test(ua) && !window.MSStream);
    }, []);

    const handleInstallClick = async () => {
        if (isInstallable) {
            await promptInstall();
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, var(--background) 0%, var(--secondary) 100%)',
            padding: '2rem 1rem'
        }}>
            {/* Hero Section */}
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                textAlign: 'center',
                paddingTop: '4rem'
            }}>
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '28px',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    margin: '0 auto 2rem',
                    boxShadow: '0 20px 60px rgba(249, 115, 22, 0.4)'
                }}>
                    📚
                </div>

                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: '800',
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '1rem'
                }}>
                    Notvarmı Mobil Uygulama
                </h1>

                <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--text-secondary)',
                    maxWidth: '600px',
                    margin: '0 auto 2rem',
                    lineHeight: '1.7'
                }}>
                    Notlarına, derslerine ve topluluğa her yerden erişim sağla. Uygulamayı telefonuna yükleyerek çevrimdışı bile kullanabilirsin!
                </p>

                {isInstalled ? (
                    <div style={{
                        padding: '1.5rem 2rem',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
                        borderRadius: '16px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#10b981'
                    }}>
                        ✅ Uygulama zaten yüklü!
                    </div>
                ) : isInstallable ? (
                    <button
                        onClick={handleInstallClick}
                        style={{
                            padding: '1.2rem 3rem',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            boxShadow: '0 10px 40px rgba(249, 115, 22, 0.4)',
                            transition: 'all 0.3s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 15px 50px rgba(249, 115, 22, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 40px rgba(249, 115, 22, 0.4)';
                        }}
                    >
                        📲 Şimdi Yükle
                    </button>
                ) : (
                    <div style={{
                        padding: '1.5rem 2rem',
                        background: 'var(--secondary)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        display: 'inline-block',
                        fontSize: '1rem',
                        color: 'var(--text-secondary)'
                    }}>
                        {isIOS ? '📱 iOS\'ta Safari kullanın ve aşağıdaki adımları izleyin.' : '🌐 Tarayıcınız otomatik yüklemeyi desteklemiyor. Aşağıdaki adımları takip edin.'}
                    </div>
                )}
            </div>

            {/* Installation Steps */}
            <div style={{
                maxWidth: '900px',
                margin: '4rem auto 0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem'
            }}>
                {/* Android Card */}
                <div style={{
                    background: 'var(--secondary)',
                    borderRadius: '20px',
                    padding: '2rem',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        marginBottom: '1.5rem'
                    }}>
                        🤖
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text)', marginBottom: '1rem' }}>
                        Android
                    </h3>
                    <ol style={{ color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '1.25rem' }}>
                        <li>Chrome tarayıcısını açın</li>
                        <li>Sağ üstteki <strong>⋮</strong> menüsüne tıklayın</li>
                        <li><strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin</li>
                        <li><strong>"Yükle"</strong> butonuna basın</li>
                    </ol>
                </div>

                {/* iOS Card */}
                <div style={{
                    background: 'var(--secondary)',
                    borderRadius: '20px',
                    padding: '2rem',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        marginBottom: '1.5rem'
                    }}>
                        🍎
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text)', marginBottom: '1rem' }}>
                        iPhone / iPad
                    </h3>
                    <ol style={{ color: 'var(--text-secondary)', lineHeight: '2', paddingLeft: '1.25rem' }}>
                        <li>Safari tarayıcısını açın</li>
                        <li>Ekranın altındaki <strong>paylaş</strong> simgesine tıklayın</li>
                        <li><strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin</li>
                        <li>Sağ üstten <strong>"Ekle"</strong> ye basın</li>
                    </ol>
                </div>
            </div>

            {/* Features Section */}
            <div style={{
                maxWidth: '900px',
                margin: '4rem auto 0',
                textAlign: 'center'
            }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text)', marginBottom: '2rem' }}>
                    ✨ Uygulama Avantajları
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {[
                        { icon: '⚡', title: 'Hızlı Erişim', desc: 'Tek tıkla uygulamaya gir' },
                        { icon: '📴', title: 'Çevrimdışı Mod', desc: 'İnternetsiz bile kullan' },
                        { icon: '🔔', title: 'Bildirimler', desc: 'Mesajları anında al' },
                        { icon: '🎨', title: 'Tam Ekran', desc: 'Tarayıcı çubuğu yok' }
                    ].map((feature, i) => (
                        <div key={i} style={{
                            background: 'var(--secondary)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{feature.icon}</div>
                            <h4 style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>{feature.title}</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Back Link */}
            <div style={{ textAlign: 'center', marginTop: '4rem', paddingBottom: '2rem' }}>
                <Link href="/" style={{
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'color 0.2s ease'
                }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-orange)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                    ← Ana Sayfaya Dön
                </Link>
            </div>
        </div>
    );
}
