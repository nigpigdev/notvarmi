'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [newCourse, setNewCourse] = useState({
        name: '',
        code: '',
        instructor: '',
        credits: '',
        section: ''
    });
    const [adding, setAdding] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const { t } = useLanguage();
    const { showAlert, showConfirm } = useAlert();

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 767);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const filtered = courses.filter(course =>
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (course.section && course.section.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredCourses(filtered);
    }, [searchTerm, courses]);

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
                setFilteredCourses(data);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        if (!newCourse.name || !newCourse.code) {
            await showAlert(t.courses?.nameCodeRequired || 'Ders adı ve kodu zorunludur', 'warning');
            return;
        }

        setAdding(true);
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCourse)
            });

            if (res.ok) {
                const created = await res.json();
                setCourses([created, ...courses]);
                setShowAddModal(false);
                setNewCourse({ name: '', code: '', instructor: '', credits: '', section: '' });
            } else {
                await showAlert(t.courses?.addError || 'Ders eklenirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Error adding course:', error);
            await showAlert(t.courses?.addError || 'Ders eklenirken hata oluştu', 'error');
        } finally {
            setAdding(false);
        }
    };

    const handleEditClick = (course) => {
        setEditingCourse(course);
        setShowEditModal(true);
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        if (!editingCourse.name || !editingCourse.code) {
            await showAlert(t.courses?.nameCodeRequired || 'Ders adı ve kodu zorunludur', 'warning');
            return;
        }

        setUpdating(true);
        try {
            const res = await fetch(`/api/courses/${editingCourse.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCourse)
            });

            if (res.ok) {
                const updated = await res.json();
                setCourses(courses.map(c => c.id === updated.id ? updated : c));
                setShowEditModal(false);
                setEditingCourse(null);
            } else {
                await showAlert(t.courses?.updateError || 'Ders güncellenirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Error updating course:', error);
            await showAlert(t.courses?.updateError || 'Ders güncellenirken hata oluştu', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteCourse = async () => {
        const confirmed = await showConfirm('Bu dersi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.');
        if (!confirmed) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/courses/${editingCourse.id}`, { method: 'DELETE' });
            if (res.ok) {
                setCourses(courses.filter(c => c.id !== editingCourse.id));
                setShowEditModal(false);
                setEditingCourse(null);
            } else {
                await showAlert(t.courses?.deleteError || 'Ders silinirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            await showAlert(t.courses?.deleteError || 'Ders silinirken hata oluştu', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleViewNotes = (courseId, e) => {
        e.stopPropagation();
        router.push(`/notes?courseId=${courseId}`);
    };

    const inputStyle = {
        width: '100%',
        padding: '1rem 1.25rem',
        borderRadius: '14px',
        border: '2px solid transparent',
        backgroundColor: 'rgba(255,255,255,0.05)',
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
                        📚
                    </div>
                    <h1 style={{
                        fontSize: isMobile ? '1.75rem' : '2.25rem',
                        fontWeight: '800',
                        marginBottom: '0.5rem',
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{t.courses?.title || 'Derslerim'}</h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1rem',
                        maxWidth: '400px',
                        margin: '0 auto'
                    }}>
                        {t.courses?.subtitle || 'Derslerini yönet ve notlarına hızlıca eriş'}
                    </p>
                </div>

                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1))',
                        borderRadius: '16px',
                        border: '1px solid rgba(249, 115, 22, 0.2)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f97316' }}>
                            {courses.length}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Toplam Ders
                        </div>
                    </div>
                    <div style={{
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1))',
                        borderRadius: '16px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
                            {courses.reduce((acc, c) => acc + (c._count?.notes || 0), 0)}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Toplam Not
                        </div>
                    </div>
                    {!isMobile && (
                        <div style={{
                            padding: '1.25rem',
                            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(13, 148, 136, 0.1))',
                            borderRadius: '16px',
                            border: '1px solid rgba(20, 184, 166, 0.2)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#14b8a6' }}>
                                {courses.filter(c => c.section).length}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Şubeli Ders
                            </div>
                        </div>
                    )}
                </div>

                {/* Search & Add Bar */}
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
                        <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
                            <input
                                type="text"
                                placeholder="Ders, hoca veya şube ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{
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
                                display: 'flex',
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
                            }}
                        >
                            ✨ Yeni Ders Ekle
                        </button>
                    </div>
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid var(--border)',
                            borderTop: '4px solid #f97316',
                            borderRadius: '50%',
                            margin: '0 auto 1rem',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ color: 'var(--text-secondary)' }}>{t.courses?.loading || 'Yükleniyor...'}</p>
                        <style jsx>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {filteredCourses.map((course) => (
                            <div
                                key={course.id}
                                style={{
                                    backgroundColor: 'var(--secondary)',
                                    borderRadius: '18px',
                                    padding: '1.5rem',
                                    border: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                                }}
                                onClick={() => handleEditClick(course)}
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
                                {/* Course Code & Badges */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                    marginBottom: '0.75rem'
                                }}>
                                    <span style={{
                                        padding: '0.4rem 0.9rem',
                                        borderRadius: '10px',
                                        background: 'var(--primary-gradient)',
                                        color: 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: '700'
                                    }}>
                                        {course.code}
                                    </span>
                                    {course.section && (
                                        <span style={{
                                            padding: '0.35rem 0.7rem',
                                            borderRadius: '8px',
                                            background: 'rgba(20, 184, 166, 0.15)',
                                            color: '#14b8a6',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            border: '1px solid rgba(20, 184, 166, 0.25)'
                                        }}>
                                            📌 {course.section}
                                        </span>
                                    )}
                                </div>

                                {/* Course Name */}
                                <h3 style={{
                                    fontSize: '1.15rem',
                                    fontWeight: '700',
                                    color: 'var(--text)',
                                    marginBottom: '0.75rem',
                                    lineHeight: '1.4'
                                }}>{course.name}</h3>

                                {/* Instructor & Credits */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.75rem',
                                    marginBottom: '1rem',
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {course.instructor && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            👤 {course.instructor}
                                        </span>
                                    )}
                                    {course.credits && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            ⭐ {course.credits} Kredi
                                        </span>
                                    )}
                                </div>

                                {/* Notes Preview */}
                                {course.notes && course.notes.length > 0 && (
                                    <div style={{
                                        borderTop: '1px solid var(--border)',
                                        paddingTop: '1rem',
                                        marginTop: '0.5rem'
                                    }}>
                                        <p style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            marginBottom: '0.5rem',
                                            fontWeight: '600'
                                        }}>
                                            📁 Son Notlar:
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {course.notes.map(note => (
                                                <div key={note.id} style={{
                                                    fontSize: '0.85rem',
                                                    color: 'var(--text)',
                                                    padding: '0.4rem 0.6rem',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '6px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    • {note.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer Actions */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: '1rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid var(--border)'
                                }}>
                                    <span style={{
                                        padding: '0.4rem 0.8rem',
                                        background: 'rgba(249, 115, 22, 0.1)',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        color: '#f97316',
                                        fontWeight: '600'
                                    }}>
                                        📚 {course._count?.notes || 0} Not
                                    </span>
                                    <button
                                        onClick={(e) => handleViewNotes(course.id, e)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: 'rgba(139, 92, 246, 0.1)',
                                            border: '1px solid rgba(139, 92, 246, 0.25)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            color: '#8b5cf6',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem'
                                        }}
                                    >
                                        📂 Notları Gör
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
                        }}>{t.courses?.noCourses || 'Henüz ders yok'}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {t.courses?.addFirst || 'İlk dersini ekleyerek başla!'}
                        </p>
                    </div>
                )}

                {/* Add Course Modal */}
                {showAddModal && (
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
                        onClick={() => setShowAddModal(false)}>
                        <div style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '24px',
                            padding: '0',
                            maxWidth: '500px',
                            width: isMobile ? '95%' : '100%',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                            border: '1px solid var(--border)',
                            overflow: 'hidden',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                            onClick={(e) => e.stopPropagation()}>

                            {/* Modal Header */}
                            <div style={{
                                background: 'var(--primary-gradient)',
                                padding: '1.75rem',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.75rem',
                                    margin: '0 auto 1rem',
                                    backdropFilter: 'blur(10px)'
                                }}>✨</div>
                                <h2 style={{ color: 'white', fontSize: '1.35rem', fontWeight: '700' }}>
                                    Yeni Ders Oluştur
                                </h2>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleAddCourse} style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                                            Ders Kodu <span style={{ color: '#f97316' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newCourse.code}
                                            onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                                            required
                                            placeholder="BIL101"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                                            Kredi
                                        </label>
                                        <input
                                            type="number"
                                            value={newCourse.credits}
                                            onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                                            placeholder="4"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                                        Ders Adı <span style={{ color: '#f97316' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newCourse.name}
                                        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                                        required
                                        placeholder="Bilgisayar Programlama"
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                                        Öğretim Üyesi
                                    </label>
                                    <input
                                        type="text"
                                        value={newCourse.instructor}
                                        onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                                        placeholder="Prof. Dr. Ahmet Yılmaz"
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                                        📌 Şube
                                    </label>
                                    <input
                                        type="text"
                                        value={newCourse.section}
                                        onChange={(e) => setNewCourse({ ...newCourse, section: e.target.value })}
                                        placeholder="1A, 2B..."
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
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
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={adding}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            background: 'var(--primary-gradient)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: adding ? 'not-allowed' : 'pointer',
                                            fontWeight: '700',
                                            opacity: adding ? 0.7 : 1,
                                            boxShadow: '0 8px 20px rgba(249, 115, 22, 0.3)'
                                        }}>
                                        {adding ? 'Oluşturuluyor...' : '✓ Oluştur'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Course Modal */}
                {showEditModal && editingCourse && (
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
                        onClick={() => { setShowEditModal(false); setEditingCourse(null); }}>
                        <div style={{
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '24px',
                            padding: isMobile ? '1.5rem' : '2rem',
                            maxWidth: '500px',
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
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{
                                    width: '55px',
                                    height: '55px',
                                    borderRadius: '16px',
                                    background: 'var(--primary-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    boxShadow: '0 8px 25px rgba(249, 115, 22, 0.3)'
                                }}>✏️</div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: '700' }}>
                                        Dersi Düzenle
                                    </h2>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {editingCourse.code}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateCourse}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                                            Ders Kodu <span style={{ color: '#f97316' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editingCourse.code}
                                            onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
                                            required
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                                            Kredi
                                        </label>
                                        <input
                                            type="number"
                                            value={editingCourse.credits || ''}
                                            onChange={(e) => setEditingCourse({ ...editingCourse, credits: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                                        Ders Adı <span style={{ color: '#f97316' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editingCourse.name}
                                        onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                                        required
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                                        Öğretim Üyesi
                                    </label>
                                    <input
                                        type="text"
                                        value={editingCourse.instructor || ''}
                                        onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                                        📌 Şube
                                    </label>
                                    <input
                                        type="text"
                                        value={editingCourse.section || ''}
                                        onChange={(e) => setEditingCourse({ ...editingCourse, section: e.target.value })}
                                        placeholder="1A, 2B..."
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => { setShowEditModal(false); setEditingCourse(null); }}
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
                                        onClick={handleDeleteCourse}
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
                                        🗑️ {deleting ? 'Siliniyor...' : 'Dersi Sil'}
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
