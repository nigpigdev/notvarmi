/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Production optimizations
    compress: true,
    poweredByHeader: false,

    // Experimental features for Next.js 15
    experimental: {
        // Required for large file uploads
        isrMemoryCacheSize: 0,
    },

    // Server-side request size limits (for API routes with file uploads)
    serverRuntimeConfig: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
    },

    // Image optimization
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            },
        ],
    },

    // Static file serving
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: '/api/files/uploads/:path*',
            },
            {
                source: '/avatars/:path*',
                destination: '/api/files/avatars/:path*',
            },
            {
                source: '/covers/:path*',
                destination: '/api/files/covers/:path*',
            },
            {
                source: '/reply-uploads/:path*',
                destination: '/api/files/reply-uploads/:path*',
            },
        ];
    },

    // Logging
    logging: {
        fetches: {
            fullUrl: true,
        },
    },

    // Security headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-ancestors 'self';"
                    }
                ],
            },
        ];
    },

    // Redirects for SEO
    async redirects() {
        return [
            {
                source: '/home',
                destination: '/',
                permanent: true,
            },
            // Redirect old paths to new paths
            {
                source: '/notes',
                destination: '/arsiv',
                permanent: true,
            },
            {
                source: '/notes/:path*',
                destination: '/arsiv/:path*',
                permanent: true,
            },
            {
                source: '/forum',
                destination: '/topluluk',
                permanent: true,
            },
            {
                source: '/forum/:path*',
                destination: '/topluluk/:path*',
                permanent: true,
            },
        ];
    },
};

module.exports = nextConfig;
