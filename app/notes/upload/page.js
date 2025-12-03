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

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

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
                router.push('/notes');
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

    return (
        <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/notes" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s ease'
                }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    {t.notes.backToNotes}
                </Link>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        marginBottom: '0.5rem',
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{t.notes.createNoteTitle}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        Notunu oluştur ve arkadaşlarınla paylaş 📚
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Basic Information Section */}
                <div style={{
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>
                            📝
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
                                Temel Bilgiler
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Notunun başlığını ve açıklamasını yaz
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Title */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontWeight: '600',
                                fontSize: '0.95rem'
                            }}>
                                <span style={{ color: 'var(--accent-purple)' }}>●</span>
                                {t.notes.titleLabel} *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="ör. Matematik Vize Notları"
                                style={{
                                    width: '100%',
                                    padding: '0.9rem 1rem',
                                    borderRadius: '12px',
                                    border: '2px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontWeight: '600',
                                fontSize: '0.95rem'
                            }}>
                                <span style={{ color: 'var(--accent-purple)' }}>●</span>
                                {t.notes.descriptionLabel} *
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={5}
                                placeholder="Notun hakkında kısa bir açıklama..."
                                style={{
                                    width: '100%',
                                    padding: '0.9rem 1rem',
                                    borderRadius: '12px',
                                    border: '2px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    lineHeight: '1.6',
                                    transition: 'border-color 0.2s ease'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                            />
                        </div>
                    </div>
                </div>

                {/* Course & Tags Section */}
                <div style={{
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>
                            🎯
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
                                Ders & Etiketler
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Notunu kategorize et
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Course Selection */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontWeight: '600',
                                fontSize: '0.95rem'
                            }}>
                                <span style={{ color: 'var(--accent-amber)' }}>●</span>
                                {t.notes.courseLabel} *
                            </label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <select
                                    value={courseId}
                                    onChange={(e) => setCourseId(e.target.value)}
                                    required
                                    style={{
                                        flex: 1,
                                        padding: '0.9rem 1rem',
                                        borderRadius: '12px',
                                        border: '2px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-amber)'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
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
                                        padding: '0.9rem 1.5rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: 'var(--accent-amber)',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap',
                                        transition: 'transform 0.2s ease',
                                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    + Yeni
                                </button>
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontWeight: '600',
                                fontSize: '0.95rem'
                            }}>
                                <span style={{ color: 'var(--accent-amber)' }}>●</span>
                                {t.notes.tagsLabel}
                            </label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder={t.notes.tagsPlaceholder}
                                style={{
                                    width: '100%',
                                    padding: '0.9rem 1rem',
                                    borderRadius: '12px',
                                    border: '2px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-amber)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                            />
                        </div>
                    </div>
                </div>

                {/* File Upload Section */}
                <div style={{
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>
                            📎
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
                                Dosyalar
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Notlarını yükle (Maksimum 5 dosya)
                            </p>
                        </div>
                    </div>

                    <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        padding: '2rem',
                        borderRadius: '12px',
                        border: '3px dashed var(--border)',
                        backgroundColor: 'var(--background)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        minHeight: '150px'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-blue)';
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.backgroundColor = 'var(--background)';
                        }}>
                        <div style={{
                            fontSize: '3rem',
                            opacity: 0.6
                        }}>📁</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: 'var(--text)',
                                marginBottom: '0.25rem'
                            }}>
                                {t.notes.addFiles}
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)'
                            }}>
                                {t.notes.supportedFormats}
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
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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

                {/* Privacy & Submit */}
                <div style={{
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: '1px solid var(--border)'
                }}>
                    {/* Public/Private Toggle */}
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '12px',
                        backgroundColor: isPublic ? 'rgba(34, 197, 94, 0.1)' : 'var(--background)',
                        border: `2px solid ${isPublic ? 'var(--accent-teal)' : 'var(--border)'}`,
                        cursor: files.length === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        marginBottom: '1.5rem',
                        opacity: files.length === 0 ? 0.5 : 1
                    }}>
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            disabled={files.length === 0}
                            style={{ width: '20px', height: '20px', cursor: files.length === 0 ? 'not-allowed' : 'pointer', accentColor: 'var(--accent-teal)' }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: 'var(--text)',
                                marginBottom: '0.25rem'
                            }}>
                                {isPublic ? '🌍' : '🔒'} {t.notes.publicNote}
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)'
                            }}>
                                {files.length === 0
                                    ? (t.language === 'tr' ? 'Forumda paylaşmak için önce dosya yüklemelisiniz' : 'Upload files first to share on forum')
                                    : (t.language === 'tr' ? 'Herkesle paylaş ve forumda yayınla' : 'Share with everyone and post to forum')
                                }
                            </div>
                        </div>
                    </label>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1.2rem 1.5rem',
                            background: loading ? 'var(--text-secondary)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.3s ease',
                            boxShadow: loading ? 'none' : '0 8px 20px rgba(102, 126, 234, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 28px rgba(102, 126, 234, 0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                        }}
                    >
                        {loading ? '⏳' : '✨'} {loading ? t.notes.saving : t.notes.saveNote}
                    </button>
                </div>
            </form>

            {/* New Course Modal - keeping the same modal code */}
            {showNewCourseModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}
                    onClick={() => setShowNewCourseModal(false)}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        border: '1px solid var(--border)'
                    }}
                        onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>
                            {t.notes.createNewCourse}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                    {t.notes.courseCode} *
                                </label>
                                <input
                                    type="text"
                                    value={newCourse.code}
                                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                    {t.notes.courseName} *
                                </label>
                                <input
                                    type="text"
                                    value={newCourse.name}
                                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                    {t.notes.instructor}
                                </label>
                                <input
                                    type="text"
                                    value={newCourse.instructor}
                                    onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                    {t.notes.credits}
                                </label>
                                <input
                                    type="number"
                                    value={newCourse.credits}
                                    onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowNewCourseModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '0.8rem',
                                        backgroundColor: 'transparent',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}>
                                    {t.common.cancel}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateCourse}
                                    disabled={creatingCourse}
                                    style={{
                                        flex: 1,
                                        padding: '0.8rem',
                                        backgroundColor: 'var(--accent-amber)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: creatingCourse ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        opacity: creatingCourse ? 0.7 : 1
                                    }}>
                                    {creatingCourse ? t.notes.saving : t.notes.createCourse}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Public Warning Modal - keeping the same modal code */}
            {showPublicWarning && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}
                    onClick={() => setShowPublicWarning(false)}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        border: '1px solid var(--border)'
                    }}
                        onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            fontSize: '3rem',
                            textAlign: 'center',
                            marginBottom: '1rem'
                        }}>⚠️</div>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--text)', textAlign: 'center' }}>
                            {t.notes.publicWarning}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', lineHeight: '1.6' }}>
                            {t.notes.publicWarningMessage}
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowPublicWarning(false)}
                                style={{
                                    flex: 1,
                                    padding: '0.8rem',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}>
                                {t.common.cancel}
                            </button>
                            <button
                                onClick={submitNote}
                                style={{
                                    flex: 1,
                                    padding: '0.8rem',
                                    backgroundColor: 'var(--accent-teal)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}>
                                {t.notes.sharePublic}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
