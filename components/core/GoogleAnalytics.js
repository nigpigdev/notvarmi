import Script from 'next/script';

export default function GoogleAnalytics() {
    const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Google Analytics'i sadece production ortamında veya development'ta açıkça NEXT_PUBLIC_GA_DEBUG=true ile aktif et
    const isEnabled = GA_MEASUREMENT_ID && (!isDevelopment || process.env.NEXT_PUBLIC_GA_DEBUG === 'true');

    if (!isEnabled) {
        return null;
    }

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    
                    // Enhanced configuration
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                        page_path: window.location.pathname,
                        send_page_view: true,
                        anonymize_ip: true, // GDPR compliance
                        allow_google_signals: true,
                        allow_ad_personalization_signals: false,
                        cookie_flags: 'SameSite=None;Secure'
                    });

                    ${isDevelopment ? `
                    // Development mode - log events to console
                    console.log('[Google Analytics] Debug mode enabled');
                    const originalGtag = gtag;
                    gtag = function() {
                        console.log('[GA Event]', arguments);
                        originalGtag.apply(this, arguments);
                    };
                    ` : ''}
                `}
            </Script>
        </>
    );
}
