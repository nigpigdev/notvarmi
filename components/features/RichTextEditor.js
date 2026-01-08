'use client';

import { useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamic import to avoid SSR issues - using react-quill-new for React 18 compatibility
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function RichTextEditor({ value, onChange, placeholder = 'Notunuzu buraya yazın...' }) {
    const quillRef = useRef(null);

    // Image upload handler
    const imageHandler = async () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/jpeg,image/jpg,image/png,image/gif');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                // Validate file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
                    return;
                }

                // Upload image
                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Upload failed');
                    }

                    const result = await response.json();
                    const url = result.url;

                    // Insert image into editor
                    const quill = quillRef.current?.getEditor();
                    if (quill) {
                        const range = quill.getSelection(true);
                        quill.insertEmbed(range.index, 'image', url);
                        quill.setSelection(range.index + 1);
                    }
                } catch (error) {
                    console.error('Image upload error:', error);
                    alert('Resim yüklenirken hata oluştu: ' + error.message);
                }
            }
        };
    };

    // Toolbar modules with image upload
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'font': [] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'script': 'sub' }, { 'script': 'super' }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['blockquote', 'code-block'],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        },
        clipboard: {
            matchVisual: false
        }
    }), []);

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'list', 'bullet', 'indent',
        'align',
        'blockquote', 'code-block',
        'link', 'image'
    ];

    return (
        <div style={{
            '--quill-bg': 'var(--background)',
            '--quill-border': 'var(--border)',
            '--quill-text': 'var(--text)'
        }}>
            <style jsx global>{`
                .quill {
                    background: var(--quill-bg);
                    border-radius: 12px;
                    border: 2px solid var(--quill-border);
                }
                .ql-toolbar {
                    background: var(--secondary);
                    border-top-left-radius: 12px;
                    border-top-right-radius: 12px;
                    border: none;
                    border-bottom: 2px solid var(--quill-border);
                }
                .ql-container {
                    border: none;
                    min-height: 300px;
                    font-size: 1rem;
                    font-family: inherit;
                }
                .ql-editor {
                    color: var(--quill-text);
                    min-height: 300px;
                    padding: 1rem;
                }
                .ql-editor.ql-blank::before {
                    color: var(--text-secondary);
                    font-style: normal;
                }
                .ql-stroke {
                    stroke: var(--quill-text);
                }
                .ql-fill {
                    fill: var(--quill-text);
                }
                .ql-picker-label {
                    color: var(--quill-text);
                }
                .ql-snow .ql-picker-options {
                    background: var(--secondary);
                    border: 1px solid var(--quill-border);
                }
                .ql-snow .ql-picker-item:hover {
                    color: var(--primary);
                }
                .ql-toolbar button:hover,
                .ql-toolbar button:focus,
                .ql-toolbar button.ql-active {
                    color: var(--primary);
                }
                .ql-toolbar button:hover .ql-stroke,
                .ql-toolbar button:focus .ql-stroke,
                .ql-toolbar button.ql-active .ql-stroke {
                    stroke: var(--primary);
                }
                .ql-toolbar button:hover .ql-fill,
                .ql-toolbar button:focus .ql-fill,
                .ql-toolbar button.ql-active .ql-fill {
                    fill: var(--primary);
                }
            `}</style>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />
        </div>
    );
}
