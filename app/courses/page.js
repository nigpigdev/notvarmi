'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import { useRouter } from 'next/navigation';
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
        credits: ''
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
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 767);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const filtered = courses.filter(course =>
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()))
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
            await showAlert(t.courses.nameCodeRequired || 'Ders adı ve kodu zorunludur', 'warning');
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
                setNewCourse({ name: '', code: '', instructor: '', credits: '' });
            } else {
                await showAlert(t.courses.addError || 'Ders eklenirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Error adding course:', error);
            await showAlert(t.courses.addError || 'Ders eklenirken hata oluştu', 'error');
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
            await showAlert(t.courses.nameCodeRequired || 'Ders adı ve kodu zorunludur', 'warning');
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
                await showAlert(t.courses.updateError || 'Ders güncellenirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Error updating course:', error);
            await showAlert(t.courses.updateError || 'Ders güncellenirken hata oluştu', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteCourse = async () => {
        const confirmed = await showConfirm('Bu dersi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.');
        if (!confirmed) {
            return;
        }

        setDeleting(true);
        try {
            const res = await fetch(`/api/courses/${editingCourse.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setCourses(courses.filter(c => c.id !== editingCourse.id));
                setShowEditModal(false);
                setEditingCourse(null);
            } else {
                await showAlert(t.courses.deleteError || 'Ders silinirken hata oluştu', 'error');
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            await showAlert(t.courses.deleteError || 'Ders silinirken hata oluştu', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const courseColors = [
        { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', accent: 'var(--accent-blue)' },
        { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', accent: 'var(--accent-purple)' },
        { bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.3)', accent: 'var(--accent-teal)' },
        { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', accent: 'var(--accent-amber)' },
        { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)', accent: 'var(--accent-indigo)' },
    ];

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
                }}>{t.courses.title}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    {t.courses.subtitle}
                </p>
            </div>

            {/* Search Bar and Add Button */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column' : 'row'
            }}>
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
                        placeholder={t.common.search || 'Ders ara...'}
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

                {/* Add Course Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: 'center',
                        padding: '1rem 1.5rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        whiteSpace: 'nowrap',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.5)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)';
                    }}>
                    <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>✨</span>
                    {t.courses.addCourse}
                </button>
            </div>

            {/* Statistics */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    padding: '1.5rem',
                    background: courseColors[0].bg,
                    border: `1px solid ${courseColors[0].border}`,
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: courseColors[0].accent }}>
                        {courses.length}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Toplam Ders
                    </div>
                </div>
                <div style={{
                    padding: '1.5rem',
                    background: courseColors[1].bg,
                    border: `1px solid ${courseColors[1].border}`,
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: courseColors[1].accent }}>
                        {courses.reduce((acc, c) => acc + (c._count?.notes || 0), 0)}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Toplam Not
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid var(--border)',
                        borderTop: '4px solid var(--accent-blue)',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p>{t.courses.loading}</p>
                    <style jsx>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            ) : filteredCourses.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredCourses.map((course, idx) => {
                        const colorScheme = courseColors[idx % courseColors.length];
                        return (
                            <div key={course.id}
                                onClick={() => handleEditClick(course)}
                                style={{
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = `0 8px 24px ${colorScheme.border}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>
                                <Card title={course.code}>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        color: 'var(--text)',
                                        marginBottom: '1rem'
                                    }}>
                                        {course.name}
                                    </div>

                                    {course.instructor && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.9rem',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <span>👤</span>
                                            <span>{course.instructor}</span>
                                        </div>
                                    )}

                                    {course.credits && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.9rem',
                                            marginBottom: '1rem'
                                        }}>
                                            <span>📊</span>
                                            <span>{course.credits} {t.courses.credits}</span>
                                        </div>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        paddingTop: '1rem',
                                        borderTop: '1px solid var(--border)'
                                    }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.4rem 0.8rem',
                                            background: colorScheme.bg,
                                            border: `1px solid ${colorScheme.border}`,
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            color: colorScheme.accent
                                        }}>
                                            📚 {course._count?.notes || 0} Not
                                        </div>
                                        <div style={{
                                            padding: '0.4rem 0.8rem',
                                            background: 'rgba(139, 92, 246, 0.1)',
                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            color: 'var(--accent-purple)',
                                            fontWeight: '600'
                                        }}>
                                            ✏️ Düzenle
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
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
                    <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{t.courses.noCourses}</h3>
                    <p>{t.courses.addFirst}</p>
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
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                    animation: 'fadeIn 0.2s ease-out'
                }}
                    onClick={() => setShowAddModal(false)}>
                    <style jsx>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUp {
                            from { transform: translateY(20px); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                    `}</style>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '20px',
                        padding: '0',
                        maxWidth: '500px',
                        width: isMobile ? '95%' : '100%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        animation: 'slideUp 0.3s ease-out'
                    }}
                        onClick={(e) => e.stopPropagation()}>
                        {/* Gradient Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                            padding: '2rem',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-50%',
                                right: '-20%',
                                width: '200px',
                                height: '200px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                filter: 'blur(40px)'
                            }}></div>
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                margin: '0 auto 1rem',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                border: '2px solid rgba(255,255,255,0.3)'
                            }}>
                                📚
                            </div>
                            <h2 style={{
                                marginBottom: '0.5rem',
                                color: 'white',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                position: 'relative'
                            }}>
                                Yeni Ders Oluştur
                            </h2>
                            <p style={{
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: '0.9rem',
                                margin: 0,
                                position: 'relative'
                            }}>
                                Ders bilgilerini girerek hemen başlayın
                            </p>
                        </div>

                        {/* Form Content */}
                        <div style={{ padding: '2rem' }}>
                            <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                                        🔢 {t.notes.courseCode} *
                                    </label>
                                    <input
                                        type="text"
                                        value={newCourse.code}
                                        onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                                        required
                                        placeholder="Örn: BIL101"
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
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

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
                                        📖 {t.notes.courseName} *
                                    </label>
                                    <input
                                        type="text"
                                        value={newCourse.name}
                                        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                                        required
                                        placeholder="Örn: Bilgisayar Programlama"
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
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

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
                                        👨‍🏫 {t.notes.instructor}
                                    </label>
                                    <input
                                        type="text"
                                        value={newCourse.instructor}
                                        onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                                        placeholder="Örn: Prof. Dr. Ahmet Yılmaz"
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
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

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
                                        ⭐ {t.notes.credits}
                                    </label>
                                    <input
                                        type="number"
                                        value={newCourse.credits}
                                        onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                                        placeholder="Örn: 4"
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
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
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
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={adding}
                                        style={{
                                            flex: 1,
                                            padding: '0.9rem',
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: adding ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '0.95rem',
                                            opacity: adding ? 0.7 : 1,
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!adding) {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)';
                                        }}>
                                        {adding ? '✨ Oluşturuluyor...' : '✨ Ders Oluştur'}
                                    </button>
                                </div>
                            </form>
                        </div>
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
                        setEditingCourse(null);
                    }}>
                    <div style={{
                        backgroundColor: 'var(--secondary)',
                        borderRadius: '20px',
                        padding: isMobile ? '1.5rem' : '2.5rem',
                        maxWidth: '500px',
                        width: isMobile ? '95%' : '100%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        border: '1px solid var(--border)'
                    }}
                        onClick={(e) => e.stopPropagation()}>
                        {/* Header với icon */}
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
                                Dersi Düzenle
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {editingCourse.code} - {editingCourse.name}
                            </p>
                        </div>

                        <form onSubmit={handleUpdateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                                    🔢 Ders Kodu *
                                </label>
                                <input
                                    type="text"
                                    value={editingCourse.code}
                                    onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
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
                                    📚 Ders Adı *
                                </label>
                                <input
                                    type="text"
                                    value={editingCourse.name}
                                    onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
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
                                    👤 Eğitmen
                                </label>
                                <input
                                    type="text"
                                    value={editingCourse.instructor || ''}
                                    onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                                    placeholder="Eğitmen adı (opsiyonel)"
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
                                    📊 Kredi
                                </label>
                                <input
                                    type="number"
                                    value={editingCourse.credits || ''}
                                    onChange={(e) => setEditingCourse({ ...editingCourse, credits: e.target.value })}
                                    placeholder="Kredi sayısı (opsiyonel)"
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

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                                {/* Save & Cancel */}
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingCourse(null);
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
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        style={{
                                            flex: 1,
                                            padding: '0.9rem',
                                            background: updating ? 'var(--text-secondary)' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: updating ? 'not-allowed' : 'pointer',
                                            fontWeight: '700',
                                            fontSize: '0.95rem',
                                            transition: 'all 0.3s ease',
                                            boxShadow: updating ? 'none' : '0 6px 18px rgba(139, 92, 246, 0.4)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!updating) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.5)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 6px 18px rgba(139, 92, 246, 0.4)';
                                        }}>
                                        {updating ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
                                    </button>
                                </div>

                                {/* Delete Button */}
                                <button
                                    type="button"
                                    onClick={handleDeleteCourse}
                                    disabled={deleting}
                                    style={{
                                        padding: '0.9rem',
                                        background: deleting ? 'var(--text-secondary)' : 'transparent',
                                        color: deleting ? 'white' : '#ef4444',
                                        border: deleting ? 'none' : '2px solid #ef4444',
                                        borderRadius: '12px',
                                        cursor: deleting ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.95rem',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!deleting) {
                                            e.currentTarget.style.background = '#ef4444';
                                            e.currentTarget.style.color = 'white';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!deleting) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#ef4444';
                                        }
                                    }}>
                                    {deleting ? '⏳ Siliniyor...' : '🗑️ Dersi Sil'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
