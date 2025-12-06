/**
 * In-memory Rate Limiter for Next.js API Routes
 * Provides IP-based rate limiting with sliding window algorithm
 */

// In-memory store for rate limiting (resets on server restart)
const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.windowStart > data.windowMs * 2) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Get client IP address from request
 */
export function getClientIP(request) {
    // Check Cloudflare header first (most reliable when behind CF)
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP) {
        return cfIP;
    }

    // Check standard forwarded headers
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    // Check real IP header (Nginx etc)
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback
    return 'unknown';
}

/**
 * Create a rate limiter with custom options
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @returns {Function} Rate limiter function
 */
export function createRateLimiter(options = {}) {
    const {
        windowMs = 60 * 1000, // 1 minute default
        max = 100,            // 100 requests default
        message = 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
    } = options;

    return function checkRateLimit(request, identifier = null) {
        const ip = identifier || getClientIP(request);
        const now = Date.now();

        // Create unique key for this limiter instance
        const key = `${ip}`;

        let data = rateLimitStore.get(key);

        if (!data || now - data.windowStart > windowMs) {
            // Start new window
            data = {
                count: 1,
                windowStart: now,
                windowMs,
            };
            rateLimitStore.set(key, data);
            return { success: true, remaining: max - 1, resetTime: now + windowMs };
        }

        // Increment count
        data.count++;

        if (data.count > max) {
            const resetTime = data.windowStart + windowMs;
            return {
                success: false,
                remaining: 0,
                resetTime,
                message,
                retryAfter: Math.ceil((resetTime - now) / 1000),
            };
        }

        return {
            success: true,
            remaining: max - data.count,
            resetTime: data.windowStart + windowMs
        };
    };
}

/**
 * Create rate limiter response headers
 */
export function getRateLimitHeaders(result) {
    return {
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
    };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
    // Auth endpoints - strict limit
    auth: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10,
        message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
    }),

    // Registration - very strict
    register: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5,
        message: 'Çok fazla kayıt denemesi. 15 dakika sonra tekrar deneyin.',
    }),

    // Forum posts - moderate
    forumPost: createRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        max: 3,
        message: 'Çok hızlı paylaşım yapıyorsunuz. 1 dakika bekleyin.',
    }),

    // File uploads - moderate
    upload: createRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        max: 5,
        message: 'Çok fazla dosya yüklüyorsunuz. 1 dakika bekleyin.',
    }),

    // General API - lenient
    general: createRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        max: 100,
        message: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
    }),

    // Search - moderate
    search: createRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        max: 30,
        message: 'Çok fazla arama yapıyorsunuz. Biraz bekleyin.',
    }),

    // Voting/Liking - moderate
    vote: createRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        max: 20,
        message: 'Çok hızlı işlem yapıyorsunuz. Biraz bekleyin.',
    }),
};

/**
 * Helper to apply rate limiting and return error response if needed
 */
export function applyRateLimit(request, limiter, customKey = null) {
    const result = limiter(request, customKey);

    if (!result.success) {
        return {
            limited: true,
            response: {
                status: 429,
                body: {
                    error: 'Too Many Requests',
                    message: result.message,
                    retryAfter: result.retryAfter,
                },
                headers: {
                    ...getRateLimitHeaders(result),
                    'Retry-After': String(result.retryAfter),
                },
            },
        };
    }

    return {
        limited: false,
        headers: getRateLimitHeaders(result)
    };
}
