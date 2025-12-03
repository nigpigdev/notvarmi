'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext';
import FileBadge from '@/components/FileBadge';

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { t } = useLanguage();
    const { showAlert, showConfirm } = useAlert();

    // Edit state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        fetchCourses();
        fetchNotes();
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 767);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchNotes();
    }, [selectedCourse]);

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

    const fetchNotes = async () => {
        try {
            const url = selectedCourse ? `/api/notes?courseId=${selectedCourse}` : '/api/notes';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleEditClick = (note) => {
        setEditingNote(note);
        setShowEditModal(true);
    };

    const handleUpdateNote = async (e) => {
        e.preventDefault();
        if (!editingNote.title || !editingNote.description || !editingNote.courseId) {
            await showAlert(t.notes.fillAllFields || 'Lütfen tüm alanları doldurun', 'warning');
            return;
        }

        setUpdating(true);
        try {
            const res = await fetch(`/api/notes/${editingNote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingNote)
            });

            if (res.ok) {
                const updated = await res.json();
                setNotes(notes.map(n => n.id === updated.id ? updated : n));
                setShowEditModal(false);
                setEditingNote(null);
            } else {
                await showAlert(t.notes.updateError || 'Not güncellenirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Error updating note:', error);
            await showAlert(t.notes.updateError || 'Not güncellenirken hata oluştu', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteNote = async () => {
        const confirmed = await showConfirm(t.notes.deleteConfirm || 'Bu notu silmek istediğinizden emin misiniz?');
        if (!confirmed) {
            return;
        }

        setDeleting(true);
        try {
            const res = await fetch(`/api/notes/${editingNote.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setNotes(notes.filter(n => n.id !== editingNote.id));
                setShowEditModal(false);
                setEditingNote(null);
            } else {
                await showAlert(t.notes.deleteError || 'Not silinirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            await showAlert(t.notes.deleteError || 'Not silinirken hata oluştu', 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '1rem' : '2rem 1rem' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{
                    fontSize: isMobile ? '2rem' : '2.5rem',
                    marginBottom: '1rem',
                    background: 'var(--primary-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>{t.notes.title}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    {t.notes.subtitle}
                </p>
            </div>

            {/* Course Filter, Search Bar and Upload Button */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column' : 'row'
            }}>
                {/* Course Filter */}
                <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    style={{
                        padding: '1rem 1.2rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--secondary)',
                        color: 'var(--text)',
                        fontSize: '1rem',
                        outline: 'none',
                        cursor: 'pointer',
                        minWidth: '200px',
                        width: isMobile ? '100%' : 'auto',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                >
                    <option value="">{t.notes.allCourses}</option>
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>
                            {course.code} - {course.name}
                        </option>
                    ))}
                </select>

                {/* Search Bar */}
                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)',
                        pointerEvents: 'none'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={t.notes.searchPlaceholder || 'Not ara...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--secondary)',
                            color: 'var(--text)',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                    />
                </div>

                {/* Upload Button */}
                <Link href="/notes/upload" style={{
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.5)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.4)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)';
                    }}>
                    <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>📝</span>
                    {t.notes.uploadNote}
                </Link>
            </div>

            {/* Notes Grid */}
            {loading ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid var(--border)',
                        borderTop: '4px solid var(--primary)',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p>{t.notes.loading}</p>
                    <style jsx>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            ) : notes.filter(note =>
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (note.tags && note.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
                note.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.course.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {notes.filter(note =>
                        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (note.tags && note.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        note.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        note.course.name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(note => (
                        <div key={note.id} style={{
                            transition: 'transform 0.2s ease',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            onClick={() => handleEditClick(note)}>
                            <Card title={note.title}>
                                {/* Description Preview */}
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.9rem',
                                    marginBottom: '1rem',
                                    lineHeight: '1.5',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {note.description}
                                </p>

                                {/* Course Badge */}
                                <div style={{
                                    display: 'inline-block',
                                    padding: '0.3rem 0.8rem',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    color: 'var(--accent-blue)',
                                    marginBottom: '0.8rem',
                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                    {note.course.code}
                                </div>

                                {/* Tags */}
                                {note.tags && (
                                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        {note.tags.split(',').slice(0, 3).map((tag, index) => {
                                            const colors = [
                                                { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: 'var(--accent-blue)' },
                                                { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: 'var(--accent-purple)' },
                                                { bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.3)', text: 'var(--accent-teal)' },
                                                { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: 'var(--accent-amber)' },
                                                { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)', text: 'var(--accent-indigo)' },
                                            ];
                                            const colorScheme = colors[index % colors.length];
                                            return (
                                                <span key={index} style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '4px',
                                                    backgroundColor: colorScheme.bg,
                                                    color: colorScheme.text,
                                                    border: `1px solid ${colorScheme.border}`,
                                                    fontWeight: '500'
                                                }}>
                                                    #{tag.trim()}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Files */}
                                {note.fileUrls && (() => {
                                    try {
                                        const urls = JSON.parse(note.fileUrls);
                                        if (urls.length > 0) {
                                            return (
                                                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.8rem' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {urls.slice(0, 3).map((url, index) => (
                                                            <FileBadge
                                                                key={index}
                                                                url={`/api/download?url=${encodeURIComponent(url)}`}
                                                                fileName={url.split('/').pop()}
                                                            />
                                                        ))}
                                                    </div>
                                                    {urls.length > 3 && (
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                                                            +{urls.length - 3} {t.language === 'tr' ? 'dosya daha' : 'more files'}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        }
                                    } catch (e) { return null; }
                                })()}

                                {/* Date */}
                                <div style={{
                                    marginTop: '1rem',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </div>

                                {/* Edit Button */}
                                <div style={{
                                    marginTop: '1rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid var(--border)',
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                }}>
                                    <div style={{
                                        padding: '0.4rem 0.8rem',
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        color: 'var(--accent-purple)',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        ✏️ {t.common.edit || 'Düzenle'}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                    <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{t.notes.noNotes}</h3>
                    <p>{t.notes.noNotesDesc}</p>
                </div>
            )}

            {/* Edit Note Modal */}
            {showEditModal && editingNote && (
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
                    onClick={() => {
                        setShowEditModal(false);
                        setEditingNote(null);
                    }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '20px',
                        padding: isMobile ? '1.5rem' : '2.5rem',
                        maxWidth: '600px',
                        width: isMobile ? '95%' : '100%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        border: '1px solid var(--border)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}
                        onClick={(e) => e.stopPropagation()}>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                margin: '0 auto 1rem',
                                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
                            }}>
                                ✏️
                            </div>
                            <h2 style={{ marginBottom: '0.5rem', color: 'var(--text)', fontSize: '1.5rem' }}>
                                {t.notes.editNote || 'Notu Düzenle'}
                            </h2>
                        </div>

                        <form onSubmit={handleUpdateNote} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Title */}
                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem',
                                    color: 'var(--text)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    📝 {t.notes.noteTitle || 'Not Başlığı'} *
                                </label>
                                <input
                                    type="text"
                                    value={editingNote.title}
                                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.9rem',
                                        borderRadius: '12px',
                                        border: '2px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
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
                                    fontSize: '0.9rem'
                                }}>
                                    📄 {t.notes.description || 'Açıklama'} *
                                </label>
                                <textarea
                                    value={editingNote.description}
                                    onChange={(e) => setEditingNote({ ...editingNote, description: e.target.value })}
                                    required
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '0.9rem',
                                        borderRadius: '12px',
                                        border: '2px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        resize: 'vertical',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            {/* Course */}
                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem',
                                    color: 'var(--text)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    📚 {t.notes.course || 'Ders'} *
                                </label>
                                <select
                                    value={editingNote.courseId}
                                    onChange={(e) => setEditingNote({ ...editingNote, courseId: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.9rem',
                                        borderRadius: '12px',
                                        border: '2px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">{t.notes.selectCourse}</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.code} - {course.name}
                                        </option>
                                    ))}
                                </select>
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
                                    fontSize: '0.9rem'
                                }}>
                                    🏷️ {t.notes.tags || 'Etiketler'}
                                </label>
                                <input
                                    type="text"
                                    value={editingNote.tags || ''}
                                    onChange={(e) => setEditingNote({ ...editingNote, tags: e.target.value })}
                                    placeholder="örn: vize, final, özet"
                                    style={{
                                        width: '100%',
                                        padding: '0.9rem',
                                        borderRadius: '12px',
                                        border: '2px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingNote(null);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '0.9rem',
                                            backgroundColor: 'transparent',
                                            color: 'var(--text)',
                                            border: '2px solid var(--border)',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.95rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--text-secondary)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}>
                                        {t.common.cancel || 'İptal'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        style={{
                                            flex: 1,
                                            padding: '0.9rem',
                                            backgroundColor: 'var(--accent-blue)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: updating ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '0.95rem',
                                            opacity: updating ? 0.7 : 1,
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!updating) {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.3)';
                                        }}>
                                        {updating ? (t.common.saving || 'Kaydediliyor...') : (t.common.save || 'Kaydet')}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleDeleteNote}
                                    disabled={deleting}
                                    style={{
                                        width: '100%',
                                        padding: '0.9rem',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: '2px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '12px',
                                        cursor: deleting ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.95rem',
                                        opacity: deleting ? 0.7 : 1,
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!deleting) {
                                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}>
                                    🗑️ {deleting ? (t.common.deleting || 'Siliniyor...') : (t.notes.deleteNote || 'Notu Sil')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
