const { validateFileType } = require('../lib/file-validator');

// Mocks for testing
const mockFile = (name, type) => ({ name, type });
const mockBuffer = (content, isBinary = false) => {
    if (isBinary) {
        return Buffer.from([0x00, 0x01, 0x02, 0x03]);
    }
    return Buffer.from(content);
};

async function runTests() {
    console.log('Starting Security Validation Tests...\n');

    const tests = [
        {
            name: 'Valid Image Upload',
            file: mockFile('vacation.jpg', 'image/jpeg'),
            buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG magic
            expected: true
        },
        {
            name: 'Malware Filename (xmrig)',
            file: mockFile('xmrig.txt', 'text/plain'),
            buffer: mockBuffer('some text'),
            expected: false
        },
        {
            name: 'Malware Filename (.system3d)',
            file: mockFile('.system3d', 'application/octet-stream'),
            buffer: mockBuffer('malware'),
            expected: false
        },
        {
            name: 'Malware Hidden File (.bashrc)',
            file: mockFile('.bashrc', 'text/plain'),
            buffer: mockBuffer('alias...'),
            expected: false
        },
        {
            name: 'Binary Masquerading as Text',
            file: mockFile('innocent.txt', 'text/plain'),
            buffer: mockBuffer('fake text', true), // Contains null byte
            expected: false
        },
        {
            name: 'Valid Text File',
            file: mockFile('notes.txt', 'text/plain'),
            buffer: mockBuffer('This is a valid text file.'),
            expected: true
        },
        {
            name: 'Complex Blocked Name (my_xmrig_miner.exe)',
            file: mockFile('my_xmrig_miner.exe', 'application/x-msdownload'),
            buffer: Buffer.from('MZ...'),
            expected: false
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await validateFileType(test.file, test.buffer);
            const isSuccess = result.valid === test.expected;

            if (isSuccess) {
                console.log(`✅ [PASS] ${test.name}`);
                passed++;
            } else {
                console.log(`❌ [FAIL] ${test.name}`);
                console.log(`   Expected valid: ${test.expected}, Got: ${result.valid}`);
                if (result.error) console.log(`   Error: ${result.error}`);
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
