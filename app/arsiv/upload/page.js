'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext';
import FilePreview from '@/components/FilePreview';

export default function UploadNote() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useLanguage();
    const { showAlert, showConfirm } = useAlert();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [courseId, setCourseId] = useState('');
    const [tags, setTags] = useState('');
    const [files, setFiles] = useState([]);
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState([]);
    const [showNewCourseModal, setShowNewCourseModal] = useState(false);
    const [showPublicWarning, setShowPublicWarning] = useState(false);
    const [newCourse, setNewCourse] = useState({ name: '', code: '', instructor: '', credits: '' });
    const [creatingCourse, setCreatingCourse] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch('/api/courses');
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };

        if (status === 'authenticated') {
            fetchCourses();
        }
    }, [status]);

    const handleFileChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            await showAlert(t.notes.maxFilesError || 'Max 5 files allowed', 'warning');
            return;
        }
        setFiles([...files, ...selectedFiles]);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (files.length + droppedFiles.length > 5) {
            await showAlert(t.notes.maxFilesError || 'Max 5 files allowed', 'warning');
            return;
        }
        setFiles([...files, ...droppedFiles]);
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleCreateCourse = async () => {
        if (!newCourse.name || !newCourse.code) {
            await showAlert(t.notes.courseNameRequired || 'Course name and code are required', 'warning');
            return;
        }

        setCreatingCourse(true);
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCourse),
            });

            if (res.ok) {
                const createdCourse = await res.json();
                setCourses([...courses, createdCourse]);
                setCourseId(createdCourse.id);
                setShowNewCourseModal(false);
                setNewCourse({ name: '', code: '', instructor: '', credits: '' });
            } else {
                await showAlert('Failed to create course', 'error');
            }
        } catch (error) {
            console.error('Error creating course:', error);
            await showAlert('Error creating course', 'error');
        } finally {
            setCreatingCourse(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isPublic) {
            setShowPublicWarning(true);
        } else {
            submitNote();
        }
    };

    const submitNote = async () => {
        setLoading(true);
        setShowPublicWarning(false);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('courseId', courseId);
            formData.append('tags', tags);
            formData.append('isPublic', isPublic);

            files.forEach(file => {
                formData.append('files', file);
            });

            const res = await fetch('/api/notes', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                router.push('/arsiv');
            } else {
                const error = await res.json();
                await showAlert(error.message || t.notes.uploadError, 'error');
            }
        } catch (error) {
            console.error('Error uploading note:', error);
            await showAlert(t.notes.uploadError, 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '1rem 1.25rem',
        borderRadius: '14px',
        border: '2px solid var(--border)',
        backgroundColor: 'var(--secondary)',
        color: 'var(--text)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--background)',
            padding: isMobile ? '1rem' : '2rem'
        }}>
            {/* Animated Background Gradient */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '400px',
                background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.08) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Back Button */}
                <Link href="/arsiv" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    marginBottom: '1.5rem',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.1)';
                        e.currentTarget.style.color = '#f97316';
                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    {t.notes.backToNotes}
                </Link>

                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '2.5rem',
                    padding: '2rem 1rem'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 1.5rem',
                        borderRadius: '24px',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        boxShadow: '0 20px 40px rgba(249, 115, 22, 0.3)'
                    }}>
                        📄
                    </div>
                    <h1 style={{
                        fontSize: isMobile ? '1.75rem' : '2.25rem',
                        fontWeight: '800',
                        marginBottom: '0.75rem',
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Yeni Dosya Oluştur
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1rem',
                        maxWidth: '400px',
                        margin: '0 auto'
                    }}>
                        Notlarını yükle ve düzenli tut 📚
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Main Card */}
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '20px',
                        padding: isMobile ? '1.5rem' : '2rem',
                        border: '1px solid var(--border)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
                    }}>
                        {/* Title & Description */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1.25rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>✍️</span>
                                <span style={{
                                    fontWeight: '700',
                                    fontSize: '1.1rem',
                                    color: 'var(--text)'
                                }}>Temel Bilgiler</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        color: 'var(--text)',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}>
                                        Başlık <span style={{ color: '#f97316' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        placeholder="ör. Matematik Final Notları"
                                        style={inputStyle}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#f97316';
                                            e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.05)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        color: 'var(--text)',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}>
                                        Açıklama <span style={{ color: '#f97316' }}>*</span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        rows={3}
                                        placeholder="Kısa bir açıklama ekle..."
                                        style={{
                                            ...inputStyle,
                                            resize: 'vertical',
                                            minHeight: '100px',
                                            fontFamily: 'inherit',
                                            lineHeight: '1.6'
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#f97316';
                                            e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.05)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
                            margin: '1.5rem 0'
                        }} />

                        {/* Course & Tags */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1.25rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>🎯</span>
                                <span style={{
                                    fontWeight: '700',
                                    fontSize: '1.1rem',
                                    color: 'var(--text)'
                                }}>Ders & Etiketler</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        color: 'var(--text)',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}>
                                        Ders <span style={{ color: '#f97316' }}>*</span>
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.75rem',
                                        flexDirection: isMobile ? 'column' : 'row'
                                    }}>
                                        <select
                                            value={courseId}
                                            onChange={(e) => setCourseId(e.target.value)}
                                            required
                                            style={{
                                                ...inputStyle,
                                                flex: 1,
                                                cursor: 'pointer'
                                            }}
                                            onFocus={(e) => {
                                                e.currentTarget.style.borderColor = '#f97316';
                                                e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.05)';
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = 'transparent';
                                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                            }}
                                        >
                                            <option value="">{t.notes.selectCoursePlaceholder}</option>
                                            {courses.map(course => (
                                                <option key={course.id} value={course.id}>
                                                    {course.code} - {course.name}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewCourseModal(true)}
                                            style={{
                                                padding: '1rem 1.5rem',
                                                borderRadius: '14px',
                                                border: '2px dashed rgba(249, 115, 22, 0.4)',
                                                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                                                color: '#f97316',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.15)';
                                                e.currentTarget.style.borderColor = '#f97316';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.08)';
                                                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)';
                                            }}
                                        >
                                            + Yeni Ders
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        color: 'var(--text)',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}>
                                        Etiketler
                                    </label>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        placeholder="vize, final, özet (virgülle ayır)"
                                        style={inputStyle}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#f97316';
                                            e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.05)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
                            margin: '1.5rem 0'
                        }} />

                        {/* File Upload */}
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1.25rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>📎</span>
                                <span style={{
                                    fontWeight: '700',
                                    fontSize: '1.1rem',
                                    color: 'var(--text)'
                                }}>Dosyalar</span>
                                <span style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    marginLeft: 'auto'
                                }}>
                                    {files.length}/5 dosya
                                </span>
                            </div>

                            <label
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    padding: '2.5rem 1.5rem',
                                    borderRadius: '16px',
                                    border: dragOver
                                        ? '3px dashed #f97316'
                                        : '3px dashed rgba(249, 115, 22, 0.3)',
                                    backgroundColor: dragOver
                                        ? 'rgba(249, 115, 22, 0.1)'
                                        : 'rgba(255,255,255,0.02)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    textAlign: 'center'
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onMouseEnter={(e) => {
                                    if (!dragOver) {
                                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                                        e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!dragOver) {
                                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                                    }
                                }}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.2))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.75rem'
                                }}>
                                    {dragOver ? '📥' : '📁'}
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: 'var(--text)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {dragOver ? 'Dosyaları bırak!' : 'Dosya eklemek için tıkla veya sürükle'}
                                    </div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        PDF, Word, Excel, PowerPoint
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    multiple
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                    style={{ display: 'none' }}
                                />
                            </label>

                            {/* File List */}
                            {files.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))',
                                    gap: '1rem',
                                    marginTop: '1.5rem'
                                }}>
                                    {files.map((file, index) => (
                                        <FilePreview
                                            key={index}
                                            file={file}
                                            onRemove={() => removeFile(index)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Public Toggle Card */}
                    <div
                        onClick={() => files.length > 0 && setIsPublic(!isPublic)}
                        style={{
                            backgroundColor: isPublic
                                ? 'rgba(34, 197, 94, 0.1)'
                                : 'var(--secondary)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            border: isPublic
                                ? '2px solid rgba(34, 197, 94, 0.5)'
                                : '1px solid var(--border)',
                            cursor: files.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: files.length === 0 ? 0.5 : 1,
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}
                    >
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '14px',
                            background: isPublic
                                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                : 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            transition: 'all 0.3s ease'
                        }}>
                            {isPublic ? '🌍' : '🔒'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '1rem',
                                fontWeight: '700',
                                color: 'var(--text)',
                                marginBottom: '0.25rem'
                            }}>
                                {isPublic ? 'Herkesle Paylaş' : 'Gizli Tut'}
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)'
                            }}>
                                {files.length === 0
                                    ? 'Toplulukta paylaşmak için dosya yükle'
                                    : isPublic
                                        ? 'Toplulukta yayınlanacak'
                                        : 'Sadece sen görebilirsin'
                                }
                            </div>
                        </div>
                        <div style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            backgroundColor: isPublic ? '#22c55e' : 'var(--border)',
                            position: 'relative',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                position: 'absolute',
                                top: '3px',
                                left: isPublic ? '27px' : '3px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1.25rem 2rem',
                            background: loading
                                ? 'var(--text-secondary)'
                                : 'var(--primary-gradient)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            transition: 'all 0.3s ease',
                            boxShadow: loading
                                ? 'none'
                                : '0 10px 30px rgba(249, 115, 22, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(249, 115, 22, 0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(249, 115, 22, 0.4)';
                        }}
                    >
                        {loading ? (
                            <>
                                <div style={{
                                    width: '22px',
                                    height: '22px',
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    borderTopColor: 'white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                ✨ Dosyayı Kaydet
                            </>
                        )}
                    </button>

                    <style jsx>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </form>

                {/* New Course Modal */}
                {showNewCourseModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                        onClick={() => setShowNewCourseModal(false)}>
                        <div style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '20px',
                            padding: '2rem',
                            maxWidth: '450px',
                            width: '100%',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                            border: '1px solid var(--border)'
                        }}
                            onClick={(e) => e.stopPropagation()}>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '14px',
                                    background: 'var(--primary-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem'
                                }}>📚</div>
                                <div>
                                    <h2 style={{
                                        fontSize: '1.25rem',
                                        color: 'var(--text)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        Yeni Ders Ekle
                                    </h2>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Ders bilgilerini gir
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: 'var(--text)',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            Ders Kodu *
                                        </label>
                                        <input
                                            type="text"
                                            value={newCourse.code}
                                            onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                                            placeholder="MAT101"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: 'var(--text)',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            Kredi
                                        </label>
                                        <input
                                            type="number"
                                            value={newCourse.credits}
                                            onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                                            placeholder="3"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        color: 'var(--text)',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}>
                                        Ders Adı *
                                    </label>
                                    <input
                                        type="text"
                                        value={newCourse.name}
                                        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                                        placeholder="Matematik I"
                                        style={inputStyle}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        color: 'var(--text)',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}>
                                        Öğretim Üyesi
                                    </label>
                                    <input
                                        type="text"
                                        value={newCourse.instructor}
                                        onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                                        placeholder="Prof. Dr. ..."
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    marginTop: '1rem'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewCourseModal(false)}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            backgroundColor: 'transparent',
                                            color: 'var(--text)',
                                            border: '2px solid var(--border)',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'all 0.2s ease'
                                        }}>
                                        İptal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCreateCourse}
                                        disabled={creatingCourse}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            background: 'var(--primary-gradient)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: creatingCourse ? 'not-allowed' : 'pointer',
                                            fontWeight: '700',
                                            opacity: creatingCourse ? 0.7 : 1
                                        }}>
                                        {creatingCourse ? 'Oluşturuluyor...' : 'Oluştur'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Public Warning Modal */}
                {showPublicWarning && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                        onClick={() => setShowPublicWarning(false)}>
                        <div style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '20px',
                            padding: '2rem',
                            maxWidth: '400px',
                            width: '100%',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                            border: '1px solid var(--border)',
                            textAlign: 'center'
                        }}
                            onClick={(e) => e.stopPropagation()}>

                            <div style={{
                                width: '70px',
                                height: '70px',
                                margin: '0 auto 1.5rem',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.2))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem'
                            }}>
                                ⚠️
                            </div>

                            <h2 style={{
                                marginBottom: '0.75rem',
                                color: 'var(--text)',
                                fontSize: '1.25rem'
                            }}>
                                {t.notes.publicWarning}
                            </h2>
                            <p style={{
                                color: 'var(--text-secondary)',
                                marginBottom: '2rem',
                                lineHeight: '1.6',
                                fontSize: '0.95rem'
                            }}>
                                {t.notes.publicWarningMessage}
                            </p>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowPublicWarning(false)}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        backgroundColor: 'transparent',
                                        color: 'var(--text)',
                                        border: '2px solid var(--border)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}>
                                    {t.common.cancel}
                                </button>
                                <button
                                    onClick={submitNote}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '700'
                                    }}>
                                    {t.notes.sharePublic}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
