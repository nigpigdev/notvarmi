import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';
import NotificationBell from '@/components/NotificationBell';
import Calendar from '@/components/Calendar';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import SplashScreen from '@/components/SplashScreen';
import SEOHead from '@/components/SEOHead';
import { generateOrganizationSchema, generateWebSiteSchema, baseMetadata } from '@/lib/seo';
import { ForumPostProvider } from '@/contexts/ForumPostContext';
import { AlertProvider } from '@/contexts/AlertContext';
import './globals.css'
import { Inter, Pacifico } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const pacifico = Pacifico({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-pacifico',
    display: 'swap', // Add font display swap for better performance
})

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: '#8b5cf6',
}

export const metadata = {
    ...baseMetadata,
    metadataBase: new URL('https://www.notvarmi.com'),
    title: {
        default: 'Notvarmı - Üniversite Öğrencileri Platformu',
        template: '%s | Notvarmı',
    },
    description: 'Üniversite öğrencileri için not paylaşım, ders bilgileri ve akademik yardımlaşma platformu. Derslerinizi takip edin, notlarınızı paylaşın ve sorularınıza cevap bulun.',
    keywords: ['üniversite notları', 'ders notları', 'öğrenci platformu', 'akademik yardımlaşma', 'not paylaşımı', 'forum', 'ders takibi', 'öğrenci forumu'],
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Notvarmı',
    },
    icons: {
        icon: [
            { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcut: ['/favicon.png'],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '512x512', type: 'image/png' },
            { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        ],
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '92aEaptUlxU0Z12qEr28DXdP2LXD9iSM9rUdp08kUNo',
    },
    openGraph: {
        type: 'website',
        locale: 'tr_TR',
        url: 'https://www.notvarmi.com',
        siteName: 'Notvarmı',
        title: 'Notvarmı - Üniversite Öğrencileri Platformu',
        description: 'Üniversite öğrencileri için not paylaşım ve akademik yardımlaşma platformu',
        images: [
            {
                url: '/icon-512x512.svg',
                width: 512,
                height: 512,
                alt: 'Notvarmı Logo',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Notvarmı - Üniversite Öğrencileri Platformu',
        description: 'Üniversite öğrencileri için not paylaşım ve akademik yardımlaşma platformu',
        images: ['/icon-512x512.svg'],
    },
    alternates: {
        canonical: 'https://www.notvarmi.com',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="tr" suppressHydrationWarning={true}>
            <head>
                {/* Preconnect to external domains for performance */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://www.google-analytics.com" />

                {/* DNS Prefetch */}
                <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
                <link rel="dns-prefetch" href="https://www.google-analytics.com" />

                <GoogleAnalytics />

                {/* Structured Data - Organization */}
                <SEOHead structuredData={generateOrganizationSchema()} />

                {/* Structured Data - WebSite with SearchAction */}
                <SEOHead structuredData={generateWebSiteSchema()} />

                <script dangerouslySetInnerHTML={{
                    __html: `
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/sw.js').then(
                                    function(registration) {
                                        console.log('ServiceWorker registration successful');
                                    },
                                    function(err) {
                                        console.log('ServiceWorker registration failed: ', err);
                                    }
                                );
                            });
                        }
                    `
                }} />
            </head>
            <body suppressHydrationWarning={true} className={`${inter.className} ${pacifico.variable}`}>
                <Providers>
                    <AlertProvider>
                        <ForumPostProvider>
                            <SplashScreen>
                                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                                    <Navbar />
                                    <main style={{
                                        flex: 1,
                                        padding: '2rem',
                                        maxWidth: '1200px',
                                        margin: '0 auto',
                                        width: '100%'
                                    }} className="responsive-main">
                                        {children}
                                    </main>
                                    <Footer />
                                </div>
                                <NotificationBell />
                                <Calendar />
                            </SplashScreen>
                        </ForumPostProvider>
                    </AlertProvider>
                </Providers>
            </body>
        </html>
    )
}
