'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Calendar() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('reminders'); // 'reminders' or 'calendar'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [newTask, setNewTask] = useState({
        title: '',
        priority: 'MEDIUM',
        category: 'PERSONAL',
        dueDate: '',
        dueTime: ''
    });

    // Check mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (session && isOpen) {
            fetchAllEvents();
            fetchTasks();
        }
    }, [session, isOpen]);

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/tasks');
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const fetchAllEvents = async () => {
        try {
            const allEvents = [];

            // Fetch tasks/reminders
            const tasksRes = await fetch('/api/tasks');
            if (tasksRes.ok) {
                const tasksData = await tasksRes.json();
                tasksData.forEach(task => {
                    if (task.dueDate) {
                        allEvents.push({
                            id: task.id,
                            title: task.title,
                            date: new Date(task.dueDate),
                            type: 'reminder',
                            color: '#f97316',
                            link: null,
                            category: task.category
                        });
                    }
                });
            }

            // Fetch forum posts
            const forumRes = await fetch('/api/forum/posts');
            if (forumRes.ok) {
                const data = await forumRes.json();
                const posts = data.posts || [];
                const userPosts = posts.filter(p => p.authorId === session?.user?.id);
                userPosts.forEach(post => {
                    allEvents.push({
                        id: post.id,
                        title: post.title,
                        date: new Date(post.createdAt),
                        type: 'forum',
                        color: '#ec4899',
                        link: `/topluluk/${post.id}`
                    });
                });
            }

            // Fetch courses with exams
            const coursesRes = await fetch('/api/courses');
            if (coursesRes.ok) {
                const courses = await coursesRes.json();
                courses.forEach(course => {
                    if (course.examDate) {
                        allEvents.push({
                            id: course.id,
                            title: `${course.code} Sınavı`,
                            date: new Date(course.examDate),
                            type: 'exam',
                            color: '#3b82f6',
                            link: '/courses'
                        });
                    }
                });
            }

            setEvents(allEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const showSaveMessage = (message, duration = 2000) => {
        setSaveMessage(message);
        setTimeout(() => setSaveMessage(''), duration);
    };

    const addTask = async () => {
        if (!newTask.title.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTask)
            });

            if (!res.ok) {
                throw new Error('Failed to create task');
            }

            setNewTask({ title: '', priority: 'MEDIUM', category: 'PERSONAL', dueDate: '', dueTime: '' });
            await fetchTasks();
            showSaveMessage('✅ Hatırlatıcı eklendi!');
        } catch (error) {
            showSaveMessage('❌ Hata: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const updateTask = async (taskId, updates) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                await fetchTasks();
                showSaveMessage('✅ Güncellendi!');
            }
        } catch (error) {
            showSaveMessage('❌ Hata oluştu');
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            await fetchTasks();
            showSaveMessage('🗑️ Silindi');
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        return { daysInMonth, startingDayOfWeek };
    };

    const getEventsForDay = (day) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day &&
                eventDate.getMonth() === month &&
                eventDate.getFullYear() === year;
        });
    };

    const handleEventClick = (event) => {
        if (event.link) {
            router.push(event.link);
            setIsOpen(false);
        }
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const getDeadlineStatus = (task) => {
        if (!task.dueDate) return 'none';
        const deadline = new Date(task.dueDate);
        const now = new Date();
        const diffHours = (deadline - now) / (1000 * 60 * 60);
        if (diffHours < 0) return 'overdue';
        if (diffHours < 24) return 'urgent';
        if (diffHours < 72) return 'soon';
        return 'normal';
    };

    const formatDeadline = (task) => {
        if (!task.dueDate) return '';
        const date = new Date(task.dueDate);
        const formatted = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        return task.dueTime ? `${formatted} ${task.dueTime}` : formatted;
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const incompleteTasks = tasks.filter(t => !t.completed && (filter === 'ALL' || t.category === filter));

    if (!session) return null;

    return (
        <>
            {/* Calendar Button - Square Design */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '1.5rem',
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'var(--primary-gradient)',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    zIndex: 998,
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(249, 115, 22, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.4)';
                }}
            >
                📅
                {incompleteTasks.length > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '8px',
                        minWidth: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '2px solid var(--background)',
                        padding: '0 4px'
                    }}>
                        {incompleteTasks.length > 9 ? '9+' : incompleteTasks.length}
                    </span>
                )}
            </button>

            {/* Modal */}
            {isOpen && (
                <>
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 999
                        }}
                    />

                    <div style={{
                        position: 'fixed',
                        top: isMobile ? '0' : '50%',
                        left: isMobile ? '0' : '50%',
                        right: isMobile ? '0' : 'auto',
                        bottom: isMobile ? '0' : 'auto',
                        transform: isMobile ? 'none' : 'translate(-50%, -50%)',
                        width: isMobile ? '100%' : '90%',
                        maxWidth: '800px',
                        height: isMobile ? '100%' : 'auto',
                        maxHeight: isMobile ? '100%' : '85vh',
                        background: 'var(--background)',
                        borderRadius: isMobile ? '0' : '20px',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                        zIndex: 1000,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        animation: 'modalSlideIn 0.3s ease'
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'var(--primary-gradient)',
                            padding: '1.25rem 1.5rem',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                                📋 Planlayıcı
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{
                            display: 'flex',
                            borderBottom: '2px solid var(--border)',
                            backgroundColor: 'var(--secondary)'
                        }}>
                            <button
                                onClick={() => setActiveTab('reminders')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '0.95rem',
                                    color: activeTab === 'reminders' ? '#f97316' : 'var(--text-secondary)',
                                    borderBottom: activeTab === 'reminders' ? '3px solid #f97316' : '3px solid transparent',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                ✅ Hatırlatıcılar
                                {incompleteTasks.length > 0 && (
                                    <span style={{
                                        background: '#f97316',
                                        color: 'white',
                                        borderRadius: '10px',
                                        padding: '0.15rem 0.5rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '700'
                                    }}>
                                        {incompleteTasks.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('calendar')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '0.95rem',
                                    color: activeTab === 'calendar' ? '#f97316' : 'var(--text-secondary)',
                                    borderBottom: activeTab === 'calendar' ? '3px solid #f97316' : '3px solid transparent',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                📅 Takvim
                            </button>
                        </div>

                        {/* Save Message */}
                        {saveMessage && (
                            <div style={{
                                padding: '0.75rem',
                                background: saveMessage.includes('❌') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                color: saveMessage.includes('❌') ? '#ef4444' : '#22c55e',
                                textAlign: 'center',
                                fontWeight: '600',
                                fontSize: '0.9rem'
                            }}>
                                {saveMessage}
                            </div>
                        )}

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                            {/* Reminders Tab */}
                            {activeTab === 'reminders' && (
                                <div>
                                    {/* Add Task Form */}
                                    <div style={{
                                        background: 'rgba(249, 115, 22, 0.08)',
                                        padding: '1.25rem',
                                        borderRadius: '16px',
                                        marginBottom: '1.25rem',
                                        border: '1px solid rgba(249, 115, 22, 0.2)'
                                    }}>
                                        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text)' }}>
                                            ➕ Yeni Hatırlatıcı
                                        </h3>
                                        <input
                                            type="text"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            placeholder="Hatırlatıcı başlığı..."
                                            onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem 1rem',
                                                border: '2px solid transparent',
                                                borderRadius: '12px',
                                                background: 'var(--background)',
                                                color: 'var(--text)',
                                                fontSize: '0.95rem',
                                                marginBottom: '0.75rem',
                                                outline: 'none',
                                                transition: 'all 0.2s'
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                        />
                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <select
                                                value={newTask.priority}
                                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '12px',
                                                    background: 'var(--background)',
                                                    color: 'var(--text)',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="LOW">🟢 Düşük</option>
                                                <option value="MEDIUM">🟡 Orta</option>
                                                <option value="HIGH">🔴 Yüksek</option>
                                            </select>
                                            <select
                                                value={newTask.category}
                                                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '12px',
                                                    background: 'var(--background)',
                                                    color: 'var(--text)',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="PERSONAL">👤 Kişisel</option>
                                                <option value="STUDY">📚 Ders</option>
                                                <option value="ASSIGNMENT">📝 Ödev</option>
                                                <option value="PROJECT">🚀 Proje</option>
                                                <option value="EXAM">📅 Sınav</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <input
                                                type="date"
                                                value={newTask.dueDate}
                                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '12px',
                                                    background: 'var(--background)',
                                                    color: 'var(--text)',
                                                    fontSize: '0.9rem'
                                                }}
                                            />
                                            <input
                                                type="time"
                                                value={newTask.dueTime}
                                                onChange={(e) => setNewTask({ ...newTask, dueTime: e.target.value })}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '12px',
                                                    background: 'var(--background)',
                                                    color: 'var(--text)',
                                                    fontSize: '0.9rem'
                                                }}
                                            />
                                        </div>
                                        <button
                                            onClick={addTask}
                                            disabled={!newTask.title.trim() || saving}
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem',
                                                border: 'none',
                                                borderRadius: '12px',
                                                background: newTask.title.trim() ? 'var(--primary-gradient)' : 'var(--border)',
                                                color: 'white',
                                                fontWeight: '700',
                                                fontSize: '0.95rem',
                                                cursor: newTask.title.trim() ? 'pointer' : 'not-allowed',
                                                boxShadow: newTask.title.trim() ? '0 4px 15px rgba(249, 115, 22, 0.3)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {saving ? '⏳ Kaydediliyor...' : '✅ Ekle'}
                                        </button>
                                    </div>

                                    {/* Filter Chips */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                        {['ALL', 'PERSONAL', 'STUDY', 'ASSIGNMENT', 'PROJECT', 'EXAM'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setFilter(cat)}
                                                style={{
                                                    padding: '0.5rem 0.9rem',
                                                    background: filter === cat ? 'var(--primary-gradient)' : 'var(--secondary)',
                                                    color: filter === cat ? 'white' : 'var(--text)',
                                                    border: filter === cat ? 'none' : '1px solid var(--border)',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    whiteSpace: 'nowrap',
                                                    boxShadow: filter === cat ? '0 3px 10px rgba(249, 115, 22, 0.25)' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {cat === 'ALL' ? '📋 Tümü' : cat === 'PERSONAL' ? '👤' : cat === 'STUDY' ? '📚' : cat === 'ASSIGNMENT' ? '📝' : cat === 'PROJECT' ? '🚀' : '📅'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Task List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {tasks
                                            .filter(t => filter === 'ALL' || t.category === filter)
                                            .sort((a, b) => {
                                                if (a.completed === b.completed) {
                                                    return new Date(b.createdAt) - new Date(a.createdAt);
                                                }
                                                return a.completed ? 1 : -1;
                                            })
                                            .map(task => {
                                                const deadlineStatus = getDeadlineStatus(task);
                                                return (
                                                    <div key={task.id} style={{
                                                        padding: '1rem',
                                                        background: 'var(--secondary)',
                                                        borderRadius: '14px',
                                                        border: '1px solid var(--border)',
                                                        opacity: task.completed ? 0.5 : 1,
                                                        transition: 'all 0.2s'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={task.completed}
                                                                onChange={() => updateTask(task.id, { completed: !task.completed })}
                                                                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#f97316' }}
                                                            />
                                                            <span style={{
                                                                flex: 1,
                                                                fontSize: '0.95rem',
                                                                fontWeight: '600',
                                                                color: 'var(--text)',
                                                                textDecoration: task.completed ? 'line-through' : 'none'
                                                            }}>
                                                                {task.title}
                                                            </span>
                                                            <button
                                                                onClick={() => deleteTask(task.id)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    color: 'var(--text-secondary)',
                                                                    fontSize: '1rem',
                                                                    padding: '0.3rem',
                                                                    borderRadius: '6px',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2.75rem', flexWrap: 'wrap' }}>
                                                            <span style={{
                                                                padding: '0.2rem 0.5rem',
                                                                borderRadius: '8px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: '700',
                                                                background: task.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : task.priority === 'MEDIUM' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                                                color: task.priority === 'HIGH' ? '#dc2626' : task.priority === 'MEDIUM' ? '#d97706' : '#059669'
                                                            }}>
                                                                {task.priority === 'HIGH' ? '🔴 Yüksek' : task.priority === 'MEDIUM' ? '🟡 Orta' : '🟢 Düşük'}
                                                            </span>
                                                            {task.dueDate && (
                                                                <span style={{
                                                                    padding: '0.2rem 0.5rem',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: deadlineStatus === 'overdue' ? '700' : '500',
                                                                    background: deadlineStatus === 'overdue' ? 'rgba(239, 68, 68, 0.1)' : deadlineStatus === 'urgent' ? 'rgba(245, 158, 11, 0.1)' : 'var(--background)',
                                                                    color: deadlineStatus === 'overdue' ? '#dc2626' : deadlineStatus === 'urgent' ? '#d97706' : 'var(--text-secondary)'
                                                                }}>
                                                                    📅 {formatDeadline(task)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {tasks.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                                                <p>Henüz hatırlatıcı eklemedin!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Calendar Tab */}
                            {activeTab === 'calendar' && (
                                <div>
                                    {/* Month Navigation */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '1.25rem'
                                    }}>
                                        <button
                                            onClick={previousMonth}
                                            style={{
                                                background: 'var(--secondary)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                                padding: '0.5rem 1rem',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                color: 'var(--text)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            ← Önceki
                                        </button>
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: '1.1rem',
                                            fontWeight: '700',
                                            color: 'var(--text)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {monthName}
                                        </h3>
                                        <button
                                            onClick={nextMonth}
                                            style={{
                                                background: 'var(--secondary)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                                padding: '0.5rem 1rem',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                color: 'var(--text)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Sonraki →
                                        </button>
                                    </div>

                                    {/* Day Headers */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(7, 1fr)',
                                        gap: '0.4rem',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map(day => (
                                            <div key={day} style={{
                                                textAlign: 'center',
                                                fontWeight: '700',
                                                fontSize: isMobile ? '0.75rem' : '0.85rem',
                                                color: 'var(--text-secondary)',
                                                padding: '0.5rem'
                                            }}>
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar Days */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(7, 1fr)',
                                        gap: '0.4rem'
                                    }}>
                                        {/* Empty cells */}
                                        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                                            <div key={`empty-${i}`} style={{ minHeight: isMobile ? '60px' : '75px' }} />
                                        ))}

                                        {/* Days */}
                                        {Array.from({ length: daysInMonth }).map((_, i) => {
                                            const day = i + 1;
                                            const dayEvents = getEventsForDay(day);
                                            const isToday = new Date().getDate() === day &&
                                                new Date().getMonth() === currentDate.getMonth() &&
                                                new Date().getFullYear() === currentDate.getFullYear();

                                            return (
                                                <div key={day} style={{
                                                    minHeight: isMobile ? '60px' : '75px',
                                                    background: isToday ? 'rgba(249, 115, 22, 0.15)' : 'var(--secondary)',
                                                    borderRadius: '12px',
                                                    padding: '0.4rem',
                                                    border: isToday ? '2px solid #f97316' : '1px solid var(--border)',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    <div style={{
                                                        fontWeight: '700',
                                                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                                                        color: isToday ? '#f97316' : 'var(--text)',
                                                        marginBottom: '0.2rem'
                                                    }}>
                                                        {day}
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                        {dayEvents.slice(0, 2).map((event, idx) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => handleEventClick(event)}
                                                                style={{
                                                                    background: event.color,
                                                                    color: 'white',
                                                                    fontSize: isMobile ? '0.6rem' : '0.7rem',
                                                                    padding: '0.15rem 0.3rem',
                                                                    borderRadius: '4px',
                                                                    cursor: event.link ? 'pointer' : 'default',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    fontWeight: '600'
                                                                }}
                                                                title={event.title}
                                                            >
                                                                {event.type === 'reminder' ? '🔔' : event.type === 'forum' ? '💬' : '📝'}
                                                            </div>
                                                        ))}
                                                        {dayEvents.length > 2 && (
                                                            <div style={{
                                                                fontSize: '0.65rem',
                                                                color: 'var(--text-secondary)',
                                                                fontWeight: '600'
                                                            }}>
                                                                +{dayEvents.length - 2}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Legend */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        justifyContent: 'center',
                                        marginTop: '1.5rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        {[
                                            { color: '#f97316', label: 'Hatırlatıcı' },
                                            { color: '#ec4899', label: 'Topluluk' },
                                            { color: '#3b82f6', label: 'Sınav' }
                                        ].map(item => (
                                            <div key={item.label} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                fontSize: '0.8rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                <div style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '4px',
                                                    background: item.color
                                                }} />
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: ${isMobile ? 'translateY(100%)' : 'translate(-50%, -45%)'};
                    }
                    to {
                        opacity: 1;
                        transform: ${isMobile ? 'translateY(0)' : 'translate(-50%, -50%)'};
                    }
                }
            `}</style>
        </>
    );
}
