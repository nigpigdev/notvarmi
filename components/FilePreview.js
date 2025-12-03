'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function FilePreview({ file, url, fileName, onRemove }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileType, setFileType] = useState('unknown');
    const [name, setName] = useState('');
    const [size, setSize] = useState(null);

    useEffect(() => {
        if (file) {
            setName(file.name);
            setSize(file.size);

            const type = file.type;
            const fName = file.name.toLowerCase();

            if (type.startsWith('image/')) {
                setFileType('image');
                const objectUrl = URL.createObjectURL(file);
                setPreviewUrl(objectUrl);
                return () => URL.revokeObjectURL(objectUrl);
            } else if (type === 'application/pdf' || fName.endsWith('.pdf')) {
                setFileType('pdf');
            } else if (fName.endsWith('.doc') || fName.endsWith('.docx')) {
                setFileType('word');
            } else if (fName.endsWith('.xls') || fName.endsWith('.xlsx')) {
                setFileType('excel');
            } else if (fName.endsWith('.ppt') || fName.endsWith('.pptx')) {
                setFileType('ppt');
            } else if (type.startsWith('text/') || fName.endsWith('.txt')) {
                setFileType('text');
            } else {
                setFileType('other');
            }
        } else if (url) {
            setPreviewUrl(url);
            const fName = (fileName || url.split('/').pop()).toLowerCase();
            setName(fileName || url.split('/').pop());

            // Try to guess type from extension
            if (fName.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                setFileType('image');
            } else if (fName.endsWith('.pdf')) {
                setFileType('pdf');
            } else if (fName.endsWith('.doc') || fName.endsWith('.docx')) {
                setFileType('word');
            } else if (fName.endsWith('.xls') || fName.endsWith('.xlsx')) {
                setFileType('excel');
            } else if (fName.endsWith('.ppt') || fName.endsWith('.pptx')) {
                setFileType('ppt');
            } else if (fName.endsWith('.txt')) {
                setFileType('text');
            } else {
                setFileType('other');
            }
        }
    }, [file, url, fileName]);

    const getFileIcon = () => {
        switch (fileType) {
            case 'pdf': return { color: '#e53935', label: 'PDF' };
            case 'word': return { color: '#1e88e5', label: 'WORD' };
            case 'excel': return { color: '#43a047', label: 'EXCEL' };
            case 'ppt': return { color: '#fb8c00', label: 'PPT' };
            case 'text': return { color: '#757575', label: 'TXT' };
            case 'image': return { color: '#8e24aa', label: 'IMG' };
            default: return { color: '#90a4ae', label: 'FILE' };
        }
    };

    const iconData = getFileIcon();

    const Content = () => (
        <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '210/297', // A4 ratio
            backgroundColor: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
            {fileType === 'image' && previewUrl ? (
                <img
                    src={previewUrl}
                    alt={name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            ) : (
                // Document Skeleton
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header Bar */}
                    <div style={{
                        height: '15%',
                        backgroundColor: iconData.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        letterSpacing: '1px'
                    }}>
                        {iconData.label}
                    </div>

                    {/* Content Lines Skeleton */}
                    <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ width: '80%', height: '4px', background: '#e0e0e0', borderRadius: '2px' }} />
                        <div style={{ width: '90%', height: '4px', background: '#f5f5f5', borderRadius: '2px' }} />
                        <div style={{ width: '85%', height: '4px', background: '#f5f5f5', borderRadius: '2px' }} />
                        <div style={{ width: '90%', height: '4px', background: '#f5f5f5', borderRadius: '2px' }} />
                        <div style={{ width: '60%', height: '4px', background: '#f5f5f5', borderRadius: '2px', marginTop: '4px' }} />

                        {/* Grid for Excel */}
                        {fileType === 'excel' && (
                            <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                    <div style={{ width: '30%', height: '15px', background: '#f0f0f0' }} />
                                    <div style={{ width: '30%', height: '15px', background: '#f0f0f0' }} />
                                    <div style={{ width: '30%', height: '15px', background: '#f0f0f0' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                    <div style={{ width: '30%', height: '15px', background: '#f0f0f0' }} />
                                    <div style={{ width: '30%', height: '15px', background: '#f0f0f0' }} />
                                    <div style={{ width: '30%', height: '15px', background: '#f0f0f0' }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Remove Button */}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove();
                    }}
                    style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'background 0.2s',
                        zIndex: 10
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 48, 108, 0.9)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
                >
                    ✕
                </button>
            )}
        </div>
    );

    return (
        <div style={{
            position: 'relative',
            width: '100px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            group: 'preview-card'
        }}>
            {url ? (
                <a
                    href={session ? `/api/download?url=${encodeURIComponent(url)}` : '#'}
                    target={session ? "_blank" : undefined}
                    rel={session ? "noopener noreferrer" : undefined}
                    style={{ textDecoration: 'none', display: 'block', cursor: session ? 'pointer' : 'not-allowed' }}
                    onClick={(e) => {
                        if (!session) {
                            e.preventDefault();
                            router.push('/login');
                        }
                    }}
                    onMouseEnter={(e) => {
                        const card = e.currentTarget.querySelector('div');
                        if (card) {
                            card.style.transform = 'translateY(-4px)';
                            card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        const card = e.currentTarget.querySelector('div');
                        if (card) {
                            card.style.transform = 'translateY(0)';
                            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }
                    }}
                >
                    <Content />
                </a>
            ) : (
                <Content />
            )}

            {/* File Info */}
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                }} title={name}>
                    {name}
                </div>
                {size && (
                    <div style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase'
                    }}>
                        {(size / 1024 / 1024).toFixed(2)} MB
                    </div>
                )}
            </div>
        </div>
    );
}
