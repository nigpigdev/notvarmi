const { isKnownBot, sanitizeObject } = require('../lib/security');

async function runTests() {
    console.log('Starting Advanced Security Tests...\n');

    const tests = [
        {
            name: 'Detect Malicious Bot (sqlmap)',
            input: { headers: new Map([['user-agent', 'sqlmap/1.4.7']]) },
            check: (req) => isKnownBot(req),
            expected: true
        },
        {
            name: 'Detect Malicious Bot (python-requests)',
            input: { headers: new Map([['user-agent', 'python-requests/2.25.1']]) },
            check: (req) => isKnownBot(req),
            expected: true
        },
        {
            name: 'Allow Normal Browser',
            input: { headers: new Map([['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36']]) },
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
