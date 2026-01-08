import UAParser from 'ua-parser-js';

/**
 * Parse user agent string to extract device, browser, and OS information
 */
export function parseUserAgent(userAgent) {
    if (!userAgent) {
        return {
            device: 'Unknown',
            browser: 'Unknown',
            os: 'Unknown'
        };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const device = result.device.type
        ? `${result.device.vendor || ''} ${result.device.model || ''}`.trim() || result.device.type
        : 'Desktop';

    const browser = result.browser.name
        ? `${result.browser.name} ${result.browser.version || ''}`.trim()
        : 'Unknown';

    const os = result.os.name
        ? `${result.os.name} ${result.os.version || ''}`.trim()
        : 'Unknown';

    return { device, browser, os };
}

/**
 * Get location information from IP address using ip-api.com
 */
export async function getLocationFromIP(ip) {
    // Skip for localhost/private IPs
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return {
            country: 'Local',
            city: 'Local',
            region: 'Local'
        };
    }

    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName`, {
            headers: {
                'User-Agent': 'notvarmi-SessionManager/1.0'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch location');
        }

        const data = await response.json();

        if (data.status === 'success') {
            return {
                country: data.country || 'Unknown',
                city: data.city || 'Unknown',
                region: data.regionName || 'Unknown'
            };
        }

        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown'
        };
    } catch (error) {
        console.error('Error fetching location:', error);
        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown'
        };
    }
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(req) {
    // Check various headers for IP address
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = req.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback to connection remote address (not available in Next.js Edge)
    return null;
}

/**
 * Generate a unique session token
 */
export function generateSessionToken() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Calculate session expiry date (30 days from now)
 */
export function getSessionExpiry() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    return expiryDate;
}
