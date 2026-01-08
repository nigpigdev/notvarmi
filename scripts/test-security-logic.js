
// Logic copied from lib/security.js for verification without Next.js dependencies

function isKnownBot(headers) {
    const userAgent = (headers.get('user-agent') || '').toLowerCase();

    // Whitelist common browsers (basic check to reduce false positives)
    // but many bots also use Mozilla. So we rely on specific bot keywords.

    const botPatterns = [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'java',
        'httpclient', 'axios', 'postman', 'headless', 'puppeteer', 'selenium',
        'censys', 'nmap', 'masscan', 'zgrab', 'vuln', 'nikto', 'sqlmap'
    ];

    return botPatterns.some(pattern => userAgent.includes(pattern));
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function sanitizeObject(obj) {
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

// Tests
async function runTests() {
    console.log('Starting Security Logic Tests...\n');

    const tests = [
        {
            name: 'Detect Malicious Bot (sqlmap)',
            input: { get: (k) => k === 'user-agent' ? 'sqlmap/1.4.7' : '' },
            check: (req) => isKnownBot(req),
            expected: true
        },
        {
            name: 'Detect Malicious Bot (python-requests)',
            input: { get: (k) => k === 'user-agent' ? 'python-requests/2.25.1' : '' },
            check: (req) => isKnownBot(req),
            expected: true
        },
        {
            name: 'Allow Normal Browser',
            input: { get: (k) => k === 'user-agent' ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' : '' },
            check: (req) => isKnownBot(req),
            expected: false
        },
        {
            name: 'Sanitize Object (XSS)',
            input: { name: '<script>alert(1)</script>', nested: { comment: '" onclick="bad()"' } },
            check: (obj) => {
                const sanitized = sanitizeObject(obj);
                return sanitized.name === '&lt;script&gt;alert(1)&lt;/script&gt;' &&
                    sanitized.nested.comment === '&quot; onclick=&quot;bad()&quot;';
            },
            expected: true
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = test.check(test.input);
            if (result === test.expected) {
                console.log(`✅ [PASS] ${test.name}`);
                passed++;
            } else {
                console.log(`❌ [FAIL] ${test.name}`);
                console.log(`   Expected: ${test.expected}, Got: ${result}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ [ERROR] ${test.name}: ${error.message}`);
            failed++;
        }
    }

    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
