'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext';
import FileBadge from '@/components/FileBadge';

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('notes');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const { showAlert, showConfirm } = useAlert();

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Read courseId from URL on mount
    useEffect(() => {
        const courseIdFromUrl = searchParams.get('courseId');
        if (courseIdFromUrl) {
            setSelectedCourse(courseIdFromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchCourses();
        fetchSavedPosts();
    }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 767);
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

    const fetchSavedPosts = async () => {
        try {
            const res = await fetch('/api/forum/saved');
            if (res.ok) {
                const data = await res.json();
                setSavedPosts(data.savedPosts || []);
            }
        } catch (error) {
            console.error('Error fetching saved posts:', error);
        }
    };

    const handleUnsavePost = async (postId) => {
        const confirmed = await showConfirm('Bu tartışmayı kayıtlılardan kaldırmak istediğinizden emin misiniz?');
        if (!confirmed) return;

        try {
            await fetch(`/api/forum/save?postId=${postId}`, { method: 'DELETE' });
            setSavedPosts(prev => prev.filter(p => p.post.id !== postId));
        } catch (error) {
            console.error('Error unsaving post:', error);
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
        if (!confirmed) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/notes/${editingNote.id}`, { method: 'DELETE' });
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

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.tags && note.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
        note.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.course.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputStyle = {
        padding: '1rem 1.25rem',
        borderRadius: '14px',
        border: '2px solid transparent',
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: 'var(--text)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--background)',
            padding: isMobile ? '1rem' : '2rem'
        }}>
            {/* Background Gradient */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '350px',
                background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.06) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '2rem',
                    padding: '1.5rem 1rem'
                }}>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        margin: '0 auto 1.25rem',
                        borderRadius: '20px',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        boxShadow: '0 15px 35px rgba(249, 115, 22, 0.25)'
                    }}>
                        📂
                    </div>
                    <h1 style={{
                        fontSize: isMobile ? '1.75rem' : '2.25rem',
                        fontWeight: '800',
                        marginBottom: '0.5rem',
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{t.notes.title}</h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1rem',
                        maxWidth: '400px',
                        margin: '0 auto'
                    }}>
                        {t.notes.subtitle}
                    </p>
                </div>

                {/* Tab Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => setActiveTab('notes')}
                        style={{
                            padding: '0.875rem 1.75rem',
                            borderRadius: '14px',
                            border: activeTab === 'notes' ? 'none' : '2px solid var(--border)',
                            background: activeTab === 'notes' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.03)',
                            color: activeTab === 'notes' ? 'white' : 'var(--text)',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'notes' ? '0 8px 25px rgba(249, 115, 22, 0.35)' : 'none'
                        }}
                    >
                        📁 Dosyalarım
                        {notes.length > 0 && (
                            <span style={{
                                background: activeTab === 'notes' ? 'rgba(255,255,255,0.25)' : 'rgba(249, 115, 22, 0.15)',
                                color: activeTab === 'notes' ? 'white' : '#f97316',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '700'
                            }}>{notes.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        style={{
                            padding: '0.875rem 1.75rem',
                            borderRadius: '14px',
                            border: activeTab === 'saved' ? 'none' : '2px solid var(--border)',
                            background: activeTab === 'saved' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.03)',
                            color: activeTab === 'saved' ? 'white' : 'var(--text)',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            transition: 'all 0.3s ease',
                            boxShadow: activeTab === 'saved' ? '0 8px 25px rgba(249, 115, 22, 0.35)' : 'none'
                        }}
                    >
                        🔖 Kaydedilenler
                        {savedPosts.length > 0 && (
                            <span style={{
                                background: activeTab === 'saved' ? 'rgba(255,255,255,0.25)' : 'rgba(249, 115, 22, 0.15)',
                                color: activeTab === 'saved' ? 'white' : '#f97316',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '700'
                            }}>{savedPosts.length}</span>
                        )}
                    </button>
                </div>

                {/* Search & Filter Bar */}
                <div style={{
                    backgroundColor: 'var(--secondary)',
                    borderRadius: '18px',
                    padding: isMobile ? '1rem' : '1.25rem',
                    marginBottom: '2rem',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        flexDirection: isMobile ? 'column' : 'row'
                    }}>
                        {/* Course Filter */}
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            style={{
                                ...inputStyle,
                                minWidth: '180px',
                                width: isMobile ? '100%' : 'auto',
                                cursor: 'pointer'
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
                        <div style={{
                            flex: 1,
                            width: isMobile ? '100%' : 'auto'
                        }}>
                            <input
                                type="text"
                                placeholder={t.notes.searchPlaceholder || 'Not ara...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    width: '100%'
                                }}
                            />
                        </div>

                        {/* Upload Button */}
                        <Link href="/notes/upload" style={{
                            padding: '1rem 1.75rem',
                            background: 'var(--primary-gradient)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 8px 25px rgba(249, 115, 22, 0.35)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap',
                            width: isMobile ? '100%' : 'auto',
                            justifyContent: 'center'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 35px rgba(249, 115, 22, 0.45)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.35)';
                            }}>
                            ✨ {t.notes.uploadNote}
                        </Link>
                    </div>
                </div>

                {/* Notes Grid */}
                {activeTab === 'notes' && (
                    <>
                        {loading ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '4rem 2rem'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    border: '4px solid var(--border)',
                                    borderTop: '4px solid #f97316',
                                    borderRadius: '50%',
                                    margin: '0 auto 1rem',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                <p style={{ color: 'var(--text-secondary)' }}>{t.notes.loading}</p>
                                <style jsx>{`
                                    @keyframes spin {
                                        0% { transform: rotate(0deg); }
                                        100% { transform: rotate(360deg); }
                                    }
                                `}</style>
                            </div>
                        ) : filteredNotes.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {filteredNotes.map(note => (
                                    <div
                                        key={note.id}
                                        style={{
                                            backgroundColor: 'var(--secondary)',
                                            borderRadius: '18px',
                                            padding: '1.5rem',
                                            border: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                                        }}
                                        onClick={() => handleEditClick(note)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-6px)';
                                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
                                            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                        }}
                                    >
                                        {/* Title */}
                                        <h3 style={{
                                            fontSize: '1.1rem',
                                            fontWeight: '700',
                                            color: 'var(--text)',
                                            marginBottom: '0.75rem',
                                            lineHeight: '1.4'
                                        }}>{note.title}</h3>

                                        {/* Description */}
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.9rem',
                                            marginBottom: '1rem',
                                            lineHeight: '1.6',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>{note.description}</p>

                                        {/* Course Badge */}
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.4rem 0.9rem',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1))',
                                            color: '#f97316',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            marginBottom: '0.75rem',
                                            border: '1px solid rgba(249, 115, 22, 0.2)'
                                        }}>
                                            📚 {note.course.code}
                                        </div>

                                        {/* Tags */}
                                        {note.tags && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.4rem',
                                                marginBottom: '1rem',
                                                flexWrap: 'wrap'
                                            }}>
                                                {note.tags.split(',').slice(0, 3).map((tag, index) => (
                                                    <span key={index} style={{
                                                        fontSize: '0.75rem',
                                                        padding: '0.25rem 0.6rem',
                                                        borderRadius: '6px',
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: 'var(--text-secondary)',
                                                        border: '1px solid var(--border)'
                                                    }}>
                                                        #{tag.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Files */}
                                        {note.fileUrls && (() => {
                                            try {
                                                const urls = JSON.parse(note.fileUrls);
                                                if (urls.length > 0) {
                                                    return (
                                                        <div style={{
                                                            borderTop: '1px solid var(--border)',
                                                            paddingTop: '1rem',
                                                            marginTop: '0.5rem'
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: '0.5rem'
                                                            }}>
                                                                {urls.slice(0, 2).map((url, index) => (
                                                                    <FileBadge
                                                                        key={index}
                                                                        url={`/api/download?url=${encodeURIComponent(url)}`}
                                                                        fileName={url.split('/').pop()}
                                                                    />
                                                                ))}
                                                            </div>
                                                            {urls.length > 2 && (
                                                                <span style={{
                                                                    fontSize: '0.8rem',
                                                                    color: 'var(--text-secondary)',
                                                                    display: 'block',
                                                                    marginTop: '0.5rem'
                                                                }}>
                                                                    +{urls.length - 2} dosya daha
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            } catch (e) { return null; }
                                        })()}

                                        {/* Footer */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginTop: '1rem',
                                            paddingTop: '1rem',
                                            borderTop: '1px solid var(--border)'
                                        }}>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                📅 {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                            <span style={{
                                                padding: '0.4rem 0.8rem',
                                                background: 'rgba(249, 115, 22, 0.1)',
                                                borderRadius: '8px',
                                                fontSize: '0.8rem',
                                                color: '#f97316',
                                                fontWeight: '600'
                                            }}>
                                                ✏️ Düzenle
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '4rem 2rem',
                                backgroundColor: 'var(--secondary)',
                                borderRadius: '20px',
                                border: '1px solid var(--border)'
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto 1.5rem',
                                    borderRadius: '20px',
                                    background: 'rgba(249, 115, 22, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem'
                                }}>📚</div>
                                <h3 style={{
                                    color: 'var(--text)',
                                    marginBottom: '0.5rem',
                                    fontSize: '1.25rem'
                                }}>{t.notes.noNotes}</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>{t.notes.noNotesDesc}</p>
                            </div>
                        )}
                    </>
                )}

                {/* Saved Posts Grid */}
                {activeTab === 'saved' && (
                    <>
                        {savedPosts.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {savedPosts.map(saved => (
                                    <div
                                        key={saved.id}
                                        style={{
                                            backgroundColor: 'var(--secondary)',
                                            borderRadius: '18px',
                                            padding: '1.5rem',
                                            border: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                                        }}
                                        onClick={() => router.push(`/forum/${saved.post.id}`)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-6px)';
                                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
                                            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                        }}
                                    >
                                        {/* Forum Badge */}
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.4rem 0.9rem',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15))',
                                            color: '#8b5cf6',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            marginBottom: '0.75rem',
                                            border: '1px solid rgba(139, 92, 246, 0.25)'
                                        }}>
                                            💬 Forum Tartışması
                                        </div>

                                        {/* Title */}
                                        <h3 style={{
                                            fontSize: '1.1rem',
                                            fontWeight: '700',
                                            color: 'var(--text)',
                                            marginBottom: '0.75rem',
                                            lineHeight: '1.4'
                                        }}>{saved.post.title.replace('(Not Paylaşıldı) ', '')}</h3>

                                        {/* Content */}
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.9rem',
                                            marginBottom: '1rem',
                                            lineHeight: '1.6',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>{saved.post.content}</p>

                                        {/* Tags */}
                                        {saved.post.tags && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.4rem',
                                                marginBottom: '1rem',
                                                flexWrap: 'wrap'
                                            }}>
                                                {saved.post.tags.split(',').slice(0, 3).map((tag, index) => (
                                                    <span key={index} style={{
                                                        fontSize: '0.75rem',
                                                        padding: '0.25rem 0.6rem',
                                                        borderRadius: '6px',
                                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                                        color: 'var(--text-secondary)',
                                                        border: '1px solid var(--border)'
                                                    }}>
                                                        #{tag.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Files */}
                                        {saved.post.fileUrls && (() => {
                                            try {
                                                const urls = JSON.parse(saved.post.fileUrls);
                                                if (urls.length > 0) {
                                                    return (
                                                        <div style={{
                                                            borderTop: '1px solid var(--border)',
                                                            paddingTop: '1rem',
                                                            marginTop: '0.5rem'
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: '0.5rem'
                                                            }}>
                                                                {urls.slice(0, 2).map((url, index) => (
                                                                    <FileBadge
                                                                        key={index}
                                                                        url={`/api/download?url=${encodeURIComponent(url)}`}
                                                                        fileName={url.split('/').pop()}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            } catch (e) { return null; }
                                        })()}

                                        {/* Author & Actions */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginTop: '1rem',
                                            paddingTop: '1rem',
                                            borderTop: '1px solid var(--border)'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <div style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'rgba(249, 115, 22, 0.15)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    color: '#f97316',
                                                    overflow: 'hidden'
                                                }}>
                                                    {saved.post.author.avatar ? (
                                                        <img src={saved.post.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        saved.post.author.name?.[0]?.toUpperCase() || '?'
                                                    )}
                                                </div>
                                                <span style={{
                                                    fontSize: '0.85rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {saved.post.author.name}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnsavePost(saved.post.id);
                                                }}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    borderRadius: '8px',
                                                    fontSize: '0.8rem',
                                                    color: '#ef4444',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                🗑️ Kaldır
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '4rem 2rem',
                                backgroundColor: 'var(--secondary)',
                                borderRadius: '20px',
                                border: '1px solid var(--border)'
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto 1.5rem',
                                    borderRadius: '20px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem'
                                }}>🔖</div>
                                <h3 style={{
                                    color: 'var(--text)',
                                    marginBottom: '0.5rem',
                                    fontSize: '1.25rem'
                                }}>Henüz kayıtlı tartışma yok</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    Forum'dan tartışmaları kaydetmek için "Kaydet" butonuna tıklayın.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Edit Modal */}
                {showEditModal && editingNote && (
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
                        onClick={() => {
                            setShowEditModal(false);
                            setEditingNote(null);
                        }}>
                        <div style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '24px',
                            padding: isMobile ? '1.5rem' : '2rem',
                            maxWidth: '550px',
                            width: isMobile ? '95%' : '100%',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                            border: '1px solid var(--border)',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                            onClick={(e) => e.stopPropagation()}>

                            {/* Modal Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '1.75rem'
                            }}>
                                <div style={{
                                    width: '55px',
                                    height: '55px',
                                    borderRadius: '16px',
                                    background: 'var(--primary-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.75rem',
                                    boxShadow: '0 8px 25px rgba(249, 115, 22, 0.3)'
                                }}>✏️</div>
                                <div>
                                    <h2 style={{
                                        fontSize: '1.35rem',
                                        color: 'var(--text)',
                                        marginBottom: '0.25rem',
                                        fontWeight: '700'
                                    }}>
                                        Dosyayı Düzenle
                                    </h2>
                                    <p style={{
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Bilgileri güncelleyin
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateNote} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Title */}
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
                                        value={editingNote.title}
                                        onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                                        required
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

                                {/* Description */}
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
                                        value={editingNote.description}
                                        onChange={(e) => setEditingNote({ ...editingNote, description: e.target.value })}
                                        required
                                        rows={3}
                                        style={{
                                            ...inputStyle,
                                            resize: 'vertical',
                                            minHeight: '90px',
                                            fontFamily: 'inherit'
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

                                {/* Course */}
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
                                    <select
                                        value={editingNote.courseId}
                                        onChange={(e) => setEditingNote({ ...editingNote, courseId: e.target.value })}
                                        required
                                        style={{
                                            ...inputStyle,
                                            cursor: 'pointer'
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
                                        value={editingNote.tags || ''}
                                        onChange={(e) => setEditingNote({ ...editingNote, tags: e.target.value })}
                                        placeholder="vize, final, özet"
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Actions */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    marginTop: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEditModal(false);
                                                setEditingNote(null);
                                            }}
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
                                            type="submit"
                                            disabled={updating}
                                            style={{
                                                flex: 1,
                                                padding: '1rem',
                                                background: 'var(--primary-gradient)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                cursor: updating ? 'not-allowed' : 'pointer',
                                                fontWeight: '700',
                                                opacity: updating ? 0.7 : 1,
                                                boxShadow: '0 8px 20px rgba(249, 115, 22, 0.3)'
                                            }}>
                                            {updating ? 'Kaydediliyor...' : '✓ Kaydet'}
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleDeleteNote}
                                        disabled={deleting}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '2px solid rgba(239, 68, 68, 0.2)',
                                            borderRadius: '12px',
                                            cursor: deleting ? 'not-allowed' : 'pointer',
                                            fontWeight: '600',
                                            opacity: deleting ? 0.7 : 1
                                        }}>
                                        🗑️ {deleting ? 'Siliniyor...' : 'Dosyayı Sil'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
