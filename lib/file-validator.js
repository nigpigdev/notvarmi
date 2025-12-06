/**
 * File Validation Utility
 * Provides comprehensive file security validation
 * to prevent malicious file uploads
 */

// Dangerous file extensions that should NEVER be accepted
const DANGEROUS_EXTENSIONS = [
    // Executables
    'exe', 'msi', 'dll', 'so', 'dylib', 'bin', 'app', 'dmg', 'deb', 'rpm',
    // Scripts
    'sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1', 'vbs', 'js', 'jsx', 'ts', 'tsx',
    'py', 'pyc', 'pyo', 'rb', 'pl', 'php', 'phtml', 'php3', 'php4', 'php5', 'phps',
    'asp', 'aspx', 'jsp', 'jspx', 'cgi', 'htaccess',
    // Archives that could contain executables (optional - can be enabled)
    // 'tar', 'gz', 'bz2', '7z', 'xz',
    // System files
    'sys', 'drv', 'ini', 'reg', 'inf',
    // Other dangerous
    'scr', 'pif', 'com', 'jar', 'class', 'war', 'ear',
    'elf', 'out', 'run', 'action', 'apk', 'ipa',
    // Config files
    'env', 'json', 'yaml', 'yml', 'toml', 'xml', 'config',
];

// Safe file types with their MIME types and magic bytes
const SAFE_FILE_TYPES = {
    // Images
    'image/jpeg': { extensions: ['jpg', 'jpeg'], magic: [0xFF, 0xD8, 0xFF] },
    'image/png': { extensions: ['png'], magic: [0x89, 0x50, 0x4E, 0x47] },
    'image/gif': { extensions: ['gif'], magic: [0x47, 0x49, 0x46, 0x38] },
    'image/webp': { extensions: ['webp'], magic: [0x52, 0x49, 0x46, 0x46] },
    'image/svg+xml': { extensions: ['svg'], magic: null }, // SVG is text-based

    // Documents
    'application/pdf': { extensions: ['pdf'], magic: [0x25, 0x50, 0x44, 0x46] },
    'application/msword': { extensions: ['doc'], magic: [0xD0, 0xCF, 0x11, 0xE0] },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        extensions: ['docx'], magic: [0x50, 0x4B, 0x03, 0x04]
    },
    'application/vnd.ms-excel': { extensions: ['xls'], magic: [0xD0, 0xCF, 0x11, 0xE0] },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        extensions: ['xlsx'], magic: [0x50, 0x4B, 0x03, 0x04]
    },
    'application/vnd.ms-powerpoint': { extensions: ['ppt'], magic: [0xD0, 0xCF, 0x11, 0xE0] },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
        extensions: ['pptx'], magic: [0x50, 0x4B, 0x03, 0x04]
    },
    'text/plain': { extensions: ['txt'], magic: null },

    // Archives (carefully allowed)
    'application/zip': { extensions: ['zip'], magic: [0x50, 0x4B, 0x03, 0x04] },
    'application/x-rar-compressed': { extensions: ['rar'], magic: [0x52, 0x61, 0x72, 0x21] },
};

/**
 * Check if file extension is dangerous
 * @param {string} filename 
 * @returns {boolean}
 */
export function isDangerousExtension(filename) {
    if (!filename) return true;
    const ext = filename.split('.').pop()?.toLowerCase();
    return DANGEROUS_EXTENSIONS.includes(ext);
}

/**
 * Get file extension from filename
 * @param {string} filename 
 * @returns {string}
 */
export function getFileExtension(filename) {
    if (!filename) return '';
    return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check magic bytes of a file buffer
 * @param {Buffer} buffer 
 * @param {number[]} expectedMagic 
 * @returns {boolean}
 */
function checkMagicBytes(buffer, expectedMagic) {
    if (!expectedMagic || expectedMagic.length === 0) return true;
    if (buffer.length < expectedMagic.length) return false;

    for (let i = 0; i < expectedMagic.length; i++) {
        if (buffer[i] !== expectedMagic[i]) return false;
    }
    return true;
}

/**
 * Validate file type by checking MIME type, extension, and magic bytes
 * @param {File|{type: string, name: string}} file 
 * @param {Buffer} buffer - File contents as buffer
 * @param {string[]} allowedMimeTypes - Array of allowed MIME types
 * @returns {{valid: boolean, error?: string}}
 */
export function validateFileType(file, buffer, allowedMimeTypes = null) {
    const filename = file.name;
    const mimeType = file.type;
    const extension = getFileExtension(filename);

    // 1. Check for dangerous extensions first
    if (isDangerousExtension(filename)) {
        return {
            valid: false,
            error: `Dosya uzantısı güvenlik nedeniyle engellendi: .${extension}`
        };
    }

    // 2. Check for double extensions (e.g., file.jpg.exe)
    const parts = filename.split('.');
    if (parts.length > 2) {
        for (let i = 1; i < parts.length - 1; i++) {
            if (DANGEROUS_EXTENSIONS.includes(parts[i].toLowerCase())) {
                return {
                    valid: false,
                    error: 'Çoklu dosya uzantısı algılandı, dosya reddedildi.'
                };
            }
        }
    }

    // 3. Check MIME type against allowed list
    const effectiveAllowed = allowedMimeTypes || Object.keys(SAFE_FILE_TYPES);
    if (!effectiveAllowed.includes(mimeType)) {
        return {
            valid: false,
            error: `Dosya türü desteklenmiyor: ${mimeType}`
        };
    }

    // 4. Validate extension matches MIME type
    const expectedType = SAFE_FILE_TYPES[mimeType];
    if (expectedType && !expectedType.extensions.includes(extension)) {
        return {
            valid: false,
            error: `Dosya uzantısı MIME türüyle eşleşmiyor`
        };
    }

    // 5. Check magic bytes (file signature)
    if (expectedType && expectedType.magic && buffer) {
        if (!checkMagicBytes(buffer, expectedType.magic)) {
            return {
                valid: false,
                error: 'Dosya içeriği beklenen türle eşleşmiyor (sahte dosya algılandı)'
            };
        }
    }

    return { valid: true };
}

/**
 * Sanitize filename for safe storage
 * @param {string} filename 
 * @returns {string}
 */
export function sanitizeFilename(filename) {
    if (!filename) return 'unnamed';

    // Remove path components
    const baseName = filename.split(/[/\\]/).pop() || 'unnamed';

    // Remove or replace dangerous characters
    return baseName
        .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace special chars with underscore
        .replace(/\.{2,}/g, '.')            // Remove multiple dots
        .replace(/^\./, '')                  // Remove leading dot
        .substring(0, 200);                  // Limit length
}

/**
 * Complete file validation for uploads
 * @param {File} file 
 * @param {Buffer} buffer 
 * @param {Object} options
 * @param {string[]} options.allowedMimeTypes - Allowed MIME types
 * @param {number} options.maxSize - Maximum file size in bytes
 * @returns {{valid: boolean, error?: string, sanitizedName?: string}}
 */
export async function validateUpload(file, buffer, options = {}) {
    const {
        allowedMimeTypes = null,
        maxSize = 100 * 1024 * 1024 // 100MB default
    } = options;

    // Check file size
    if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        return {
            valid: false,
            error: `Dosya boyutu ${maxMB}MB'den büyük olamaz`
        };
    }

    // Validate file type
    const typeValidation = validateFileType(file, buffer, allowedMimeTypes);
    if (!typeValidation.valid) {
        return typeValidation;
    }

    // Return sanitized filename
    return {
        valid: true,
        sanitizedName: sanitizeFilename(file.name)
    };
}

// Export constants for use in other modules
export { DANGEROUS_EXTENSIONS, SAFE_FILE_TYPES };
