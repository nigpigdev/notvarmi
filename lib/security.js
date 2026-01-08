/**
 * Security utilities for the application
 * Provides helper functions for security-related operations
 */

import { NextResponse } from 'next/server';
import { applyRateLimit, getClientIP } from './rate-limiter';

/**
 * Suspicious patterns to detect potential attacks
 */
const SUSPICIOUS_PATTERNS = [
    /(<script|javascript:|on\w+\s*=)/i,  // XSS attempts
    /(union\s+select|insert\s+into|drop\s+table|delete\s+from)/i,  // SQL injection
    /(\.\.\/|\.\.\\)/,  // Path traversal
    /(\x00|\x0a|\x0d)/,  // Null bytes and line breaks in unexpected places
];

/**
 * Check if input contains suspicious patterns
 */
export function containsSuspiciousPatterns(input) {
    if (typeof input !== 'string') return false;
    return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize string input (basic HTML entity encoding)
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password) {
    const issues = [];

    if (password.length < 8) {
        issues.push('Şifre en az 8 karakter olmalı');
    }
    if (!/[a-z]/.test(password)) {
        issues.push('Şifre küçük harf içermeli');
    }
    if (!/[A-Z]/.test(password)) {
        issues.push('Şifre büyük harf içermeli');
    }
    if (!/[0-9]/.test(password)) {
        issues.push('Şifre rakam içermeli');
    }

    return {
        isStrong: issues.length === 0,
        issues,
        score: 4 - issues.length, // 0-4 score
    };
}

/**
 * Wrapper function to apply rate limiting to API routes
 * @param {Request} request - Next.js request object
 * @param {Function} limiter - Rate limiter function from rate-limiter.js
 * @param {Function} handler - The actual API handler function
 * @returns {Promise<Response>}
 */
export async function withRateLimit(request, limiter, handler) {
    const rateLimit = applyRateLimit(request, limiter);

    if (rateLimit.limited) {
        return NextResponse.json(
            rateLimit.response.body,
            {
                status: rateLimit.response.status,
                headers: rateLimit.response.headers,
            }
        );
    }

    // Execute the handler and add rate limit headers to response
    const response = await handler();

    // If response is already a NextResponse, add headers
    if (response instanceof NextResponse) {
        Object.entries(rateLimit.headers).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    return response;
}

/**
 * Log security events for monitoring
 */
export function logSecurityEvent(type, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        type,
        ...details,
    };

    // In production, you might want to send this to a logging service
    console.log(`[SECURITY] ${type}:`, JSON.stringify(logEntry));
}

/**
 * Check if request is from a known bot (basic check)
 */
export function isKnownBot(request) {
    const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

    // Whitelist common browsers (basic check to reduce false positives on "Mozilla")
    // but many bots also use Mozilla. So we rely on specific bot keywords.

    const botPatterns = [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'java',
        'httpclient', 'axios', 'postman', 'headless', 'puppeteer', 'selenium',
        'censys', 'nmap', 'masscan', 'zgrab', 'vuln', 'nikto', 'sqlmap'
    ];

    return botPatterns.some(pattern => userAgent.includes(pattern));
}

/**
 * Sanitize an object (recursive)
 * @param {Object} obj 
 * @returns {Object}
 */
export function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return typeof obj === 'string' ? sanitizeInput(obj) : obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
}

/**
 * Safely stringify JSON for use in <script type="application/ld+json">
 * Prevents XSS by escaping the < character to \u003c
 * @param {Object} data 
 * @returns {string}
 */
export function safeJsonLd(data) {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Get security info from request
 */
export function getSecurityInfo(request) {
    return {
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || 'unknown',
        referer: request.headers.get('referer') || 'direct',
        origin: request.headers.get('origin') || 'unknown',
        isBot: isKnownBot(request),
    };
}
