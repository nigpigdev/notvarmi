'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdmin } from '@/lib/roles';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [replies, setReplies] = useState([]);
    const [notes, setNotes] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, title: '' });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 767);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const openDeleteModal = (type, id, title) => {
        setDeleteModal({ isOpen: true, type, id, title });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, type: null, id: null, title: '' });
    };

    const executeDelete = async () => {
        const { type, id } = deleteModal;
        closeDeleteModal();

        if (type === 'user') {
            await deleteUser(id);
        } else if (type === 'post') {
            await deletePost(id);
        } else if (type === 'reply') {
            await deleteReply(id);
        } else if (type === 'note') {
            await deleteNote(id);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            checkAdminAccess();
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const checkAdminAccess = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.role && isAdmin(data.role)) {
                    setUserRole(data.role);
                    fetchStats();
                } else {
                    router.push('/');
                }
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error('Error checking admin access:', error);
            router.push('/');
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (searchTerm) queryParams.append('search', searchTerm);
            if (selectedRole) queryParams.append('role', selectedRole);

            const res = await fetch(`/api/admin/users?${queryParams}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/admin/posts');
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const fetchReplies = async () => {
        try {
            const res = await fetch('/api/admin/replies');
            if (res.ok) {
                const data = await res.json();
                setReplies(data.replies);
            }
        } catch (error) {
            console.error('Error fetching replies:', error);
        }
    };

    const fetchNotes = async () => {
        try {
            const res = await fetch('/api/admin/notes');
            if (res.ok) {
                const data = await res.json();
                setNotes(data.notes);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/admin/reports');
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    const handleUpdateReportStatus = async (reportId, newStatus) => {
        try {
            const res = await fetch(`/api/admin/reports/${reportId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchReports();
            } else {
                alert('Failed to update report status');
            }
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Error updating report');
        }
    };

    const handleBanUser = async (e, userId, currentBanned) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm(currentBanned ? 'Bu kullanıcının banını kaldırmak istediğinizden emin misiniz?' : 'Bu kullanıcıyı banlamak istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banned: !currentBanned })
            });

            if (res.ok) {
                alert(currentBanned ? 'Kullanıcının banı kaldırıldı' : 'Kullanıcı banlandı');
                fetchUsers();
            } else {
                const error = await res.json();
                alert(error.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Bir hata oluştu');
        }
    };

    const handleDeleteUser = (e, userId) => {
        e.preventDefault();
        e.stopPropagation();
        openDeleteModal('user', userId, 'Bu kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz?');
    };

    const deleteUser = async (userId) => {
        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('Kullanıcı silindi');
                fetchUsers();
                fetchStats();
            } else {
                const error = await res.json();
                console.error('Delete user error:', error);
                alert(error.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Bir hata oluştu');
        }
    };

    const handleDeletePost = (e, postId) => {
        e.preventDefault();
        e.stopPropagation();
        openDeleteModal('post', postId, 'Bu gönderiyi silmek istediğinizden emin misiniz?');
    };

    const deletePost = async (postId) => {
        try {
            const res = await fetch(`/api/admin/posts?id=${postId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('Gönderi silindi');
                fetchPosts();
                fetchStats();
            } else {
                const error = await res.json();
                console.error('Delete post error:', error);
                alert(error.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Bir hata oluştu: ' + error.message);
        }
    };

    const handleDeleteReply = (e, replyId) => {
        e.preventDefault();
        e.stopPropagation();
        openDeleteModal('reply', replyId, 'Bu yanıtı silmek istediğinizden emin misiniz?');
    };

    const deleteReply = async (replyId) => {
        try {
            const res = await fetch(`/api/admin/replies?id=${replyId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('Yanıt silindi');
                fetchReplies();
                fetchStats();
            } else {
                const error = await res.json();
                console.error('Delete reply error:', error);
                alert(error.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Error deleting reply:', error);
            alert('Bir hata oluştu: ' + error.message);
        }
    };

    const handleDeleteNote = (e, noteId) => {
        e.preventDefault();
        e.stopPropagation();
        openDeleteModal('note', noteId, 'Bu notu silmek istediğinizden emin misiniz?');
    };

    const deleteNote = async (noteId) => {
        try {
            const res = await fetch(`/api/admin/notes?id=${noteId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('Not silindi');
                fetchNotes();
                fetchStats();
            } else {
                const error = await res.json();
                console.error('Delete note error:', error);
                alert(error.error || 'Bir hata oluştu');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Bir hata oluştu: ' + error.message);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'posts') {
            fetchPosts();
        } else if (activeTab === 'replies') {
            fetchReplies();
        } else if (activeTab === 'notes') {
            fetchNotes();
        } else if (activeTab === 'reports') {
            fetchReports();
        }
    }, [activeTab, searchTerm, selectedRole]);

    // Styles
    const containerStyle = {
        minHeight: '100vh',
        background: 'var(--background)',
        padding: isMobile ? '1rem' : '2rem'
    };

    const contentStyle = {
        maxWidth: '1400px',
        margin: '0 auto'
    };

    const cardStyle = {
        background: 'var(--secondary)',
        borderRadius: '20px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        border: '1px solid var(--border)',
        transition: 'all 0.3s ease'
    };

    const tabButtonStyle = (isActive) => ({
        padding: isMobile ? '0.6rem 1rem' : '0.8rem 1.5rem',
        background: isActive ? 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' : 'transparent',
        color: isActive ? 'white' : 'var(--text)',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: isActive ? '600' : '500',
        fontSize: isMobile ? '0.85rem' : '1rem',
        transition: 'all 0.2s',
        boxShadow: isActive ? '0 4px 15px rgba(249, 115, 22, 0.3)' : 'none',
        whiteSpace: 'nowrap'
    });

    const inputStyle = {
        padding: '0.9rem 1.2rem',
        borderRadius: '12px',
        border: '2px solid var(--border)',
        background: 'var(--background)',
        color: 'var(--text)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.2s'
    };

    const tableHeaderStyle = {
        padding: '1rem',
        textAlign: 'left',
        color: 'var(--text)',
        fontWeight: '600',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const tableCellStyle = {
        padding: '1rem',
        borderBottom: '1px solid var(--border)'
    };

    const badgeStyle = (color) => ({
        padding: '0.3rem 0.8rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        background: color,
        color: 'white',
        whiteSpace: 'nowrap'
    });

    const actionButtonStyle = (color) => ({
        padding: '0.5rem 0.8rem',
        background: color,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        minWidth: '40px'
    });

    if (loading || status === 'loading' || !userRole) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--background)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '3px solid var(--border)',
                        borderTopColor: '#f97316',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }} />
                    <div style={{ color: 'var(--text)', fontSize: '1.1rem' }}>Yükleniyor...</div>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {/* Background Gradient */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '350px',
                background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.08) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{ ...contentStyle, position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: isMobile ? '1.75rem' : '2.5rem',
                            fontWeight: '800',
                            marginBottom: '0.5rem',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            🛡️ Admin Paneli
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                            Hoş geldin, <strong style={{ color: '#f97316' }}>{session?.user?.firstName || 'Admin'}</strong> ({userRole})
                        </p>
                    </div>
                    {activeTab !== 'dashboard' && (
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            style={{
                                padding: '0.8rem 1.5rem',
                                background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
                            }}
                        >
                            ← Panele Dön
                        </button>
                    )}
                </div>

                {/* Tab Navigation */}
                <div style={{
                    ...cardStyle,
                    marginBottom: '2rem',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    overflowX: 'auto',
                    padding: '1rem'
                }}>
                    {['dashboard', 'users', 'posts', 'replies', 'notes', 'reports'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={tabButtonStyle(activeTab === tab)}
                        >
                            {tab === 'dashboard' && '📊 Dashboard'}
                            {tab === 'users' && '👥 Kullanıcılar'}
                            {tab === 'posts' && '📝 Gönderiler'}
                            {tab === 'replies' && '💬 Yanıtlar'}
                            {tab === 'notes' && '📄 Notlar'}
                            {tab === 'reports' && '⚠️ Raporlar'}
                        </button>
                    ))}
                    <Link href="/admin/announcements" style={{
                        ...tabButtonStyle(false),
                        textDecoration: 'none'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
                            e.currentTarget.style.color = '#f97316';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text)';
                        }}>
                        📢 Duyurular
                    </Link>
                </div>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && stats && (
                    <div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem',
                            marginBottom: '2rem'
                        }}>
                            {[
                                { label: 'Toplam Kullanıcı', value: stats.stats.totalUsers, icon: '👥', gradient: 'linear-gradient(135deg, #f97316, #fbbf24)' },
                                { label: 'Toplam Gönderi', value: stats.stats.totalPosts, icon: '📝', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
                                { label: 'Toplam Yanıt', value: stats.stats.totalReplies, icon: '💬', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
                                { label: 'Toplam Not', value: stats.stats.totalNotes, icon: '📄', gradient: 'linear-gradient(135deg, #f97316, #ec4899)' },
                                { label: 'Toplam Mesaj', value: stats.stats.totalMessages, icon: '✉️', gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)' },
                                { label: 'Banlı Kullanıcı', value: stats.stats.bannedUsers, icon: '🚫', gradient: 'linear-gradient(135deg, #ef4444, #f97316)' }
                            ].map((stat, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        ...cardStyle,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: '80px',
                                        height: '80px',
                                        background: stat.gradient,
                                        opacity: 0.1,
                                        borderRadius: '0 20px 0 80px'
                                    }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{stat.label}</p>
                                            <p style={{
                                                background: stat.gradient,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                fontSize: isMobile ? '1.75rem' : '2.25rem',
                                                fontWeight: '700',
                                                margin: 0
                                            }}>{stat.value}</p>
                                        </div>
                                        <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', opacity: 0.8 }}>{stat.icon}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Users */}
                        <div style={cardStyle}>
                            <h2 style={{
                                color: 'var(--text)',
                                marginBottom: '1.5rem',
                                fontSize: '1.3rem',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>👤</span> Son Kaydolan Kullanıcılar
                            </h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                            <th style={tableHeaderStyle}>Kullanıcı Adı</th>
                                            <th style={tableHeaderStyle}>Email</th>
                                            <th style={tableHeaderStyle}>Rol</th>
                                            <th style={tableHeaderStyle}>Kayıt Tarihi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentUsers.map(user => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ ...tableCellStyle, color: '#f97316', fontWeight: '600' }}>@{user.username}</td>
                                                <td style={{ ...tableCellStyle, color: 'var(--text-secondary)' }}>{user.email}</td>
                                                <td style={tableCellStyle}>
                                                    <span style={badgeStyle(
                                                        user.role === 'POWERUSER' ? '#ef4444' : user.role === 'ADMIN' ? '#f97316' : '#3b82f6'
                                                    )}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td style={{ ...tableCellStyle, color: 'var(--text-secondary)' }}>
                                                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div style={cardStyle}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Kullanıcı ara (isim, email, kullanıcı adı)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    flex: 1,
                                    minWidth: '250px'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#f97316'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                            />
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    cursor: 'pointer',
                                    minWidth: '150px'
                                }}
                            >
                                <option value="">Tüm Roller</option>
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="POWERUSER">POWERUSER</option>
                            </select>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={tableHeaderStyle}>Kullanıcı</th>
                                        <th style={tableHeaderStyle}>Email</th>
                                        <th style={tableHeaderStyle}>Üniversite</th>
                                        <th style={tableHeaderStyle}>Rol</th>
                                        <th style={tableHeaderStyle}>Durum</th>
                                        <th style={tableHeaderStyle}>İçerik</th>
                                        <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={tableCellStyle}>
                                                <div>
                                                    <div style={{ color: 'var(--text)', fontWeight: '600' }}>
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div style={{ color: '#f97316', fontSize: '0.85rem' }}>
                                                        @{user.username}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ ...tableCellStyle, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email}</td>
                                            <td style={{ ...tableCellStyle, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                <div>{user.university || 'N/A'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{user.department || ''}</div>
                                            </td>
                                            <td style={tableCellStyle}>
                                                <span style={badgeStyle(
                                                    user.role === 'POWERUSER' ? '#ef4444' : user.role === 'ADMIN' ? '#f97316' : '#3b82f6'
                                                )}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={tableCellStyle}>
                                                {user.banned ? (
                                                    <span style={{ color: '#ef4444', fontWeight: '600', whiteSpace: 'nowrap' }}>🚫 Banlı</span>
                                                ) : (
                                                    <span style={{ color: '#10b981', fontWeight: '600', whiteSpace: 'nowrap' }}>✅ Aktif</span>
                                                )}
                                            </td>
                                            <td style={{ ...tableCellStyle, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <span>📝 {user._count.posts}</span>
                                                    <span>💬 {user._count.replies}</span>
                                                    <span>📄 {user._count.notes}</span>
                                                </div>
                                            </td>
                                            <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    {user.role !== 'POWERUSER' && !(user.role === 'ADMIN' && userRole === 'ADMIN') && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleBanUser(e, user.id, user.banned)}
                                                                title={user.banned ? 'Ban Kaldır' : 'Banla'}
                                                                style={actionButtonStyle(user.banned ? '#10b981' : '#f59e0b')}
                                                            >
                                                                {user.banned ? '✓' : '❌'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteUser(e, user.id)}
                                                                title="Kullanıcıyı Sil"
                                                                style={actionButtonStyle('#ef4444')}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </>
                                                    )}
                                                    {(user.role === 'ADMIN' && userRole === 'ADMIN') && (
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                                            Yetki yok
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Posts Tab */}
                {activeTab === 'posts' && (
                    <div style={cardStyle}>
                        <h2 style={{
                            color: 'var(--text)',
                            marginBottom: '1.5rem',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>📝</span> Tüm Gönderiler
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {posts.map(post => (
                                <div
                                    key={post.id}
                                    style={{
                                        background: 'var(--background)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        border: '1px solid var(--border)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <Link href={`/forum/${post.id}`} style={{ textDecoration: 'none' }}>
                                                <h3 style={{
                                                    color: 'var(--text)',
                                                    marginBottom: '0.5rem',
                                                    fontSize: '1.1rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'color 0.2s'
                                                }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}
                                                >
                                                    {post.title}
                                                </h3>
                                            </Link>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                                <span style={{ fontWeight: '600', color: post.author.banned ? '#ef4444' : '#f97316' }}>
                                                    @{post.author.username}
                                                </span>
                                                {post.author.banned && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>(Banlı)</span>}
                                                {' · '}
                                                {new Date(post.createdAt).toLocaleString('tr-TR')}
                                                {' · '}
                                                {post._count.replies} yanıt
                                            </div>
                                            <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
                                                {post.content.substring(0, 200)}
                                                {post.content.length > 200 && '...'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeletePost(e, post.id)}
                                            style={{
                                                ...actionButtonStyle('#ef4444'),
                                                padding: '0.6rem 1.2rem',
                                                marginLeft: '1rem'
                                            }}
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Replies Tab */}
                {activeTab === 'replies' && (
                    <div style={cardStyle}>
                        <h2 style={{
                            color: 'var(--text)',
                            marginBottom: '1.5rem',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>💬</span> Forum Yanıtları
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {replies.map(reply => (
                                <div
                                    key={reply.id}
                                    style={{
                                        background: 'var(--background)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        border: '1px solid var(--border)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: '600', color: reply.author.banned ? '#ef4444' : '#f97316' }}>
                                                    @{reply.author.username}
                                                </span>
                                                {reply.author.banned && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>(Banlı)</span>}
                                                {' → '}
                                                <Link
                                                    href={`/forum/${reply.post.id}`}
                                                    style={{
                                                        color: '#f97316',
                                                        textDecoration: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                >
                                                    {reply.post.title}
                                                </Link>
                                                {' · '}
                                                {new Date(reply.createdAt).toLocaleString('tr-TR')}
                                            </div>
                                            <p style={{ color: 'var(--text)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                                                {reply.content.substring(0, 200)}
                                                {reply.content.length > 200 && '...'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteReply(e, reply.id)}
                                            style={{
                                                ...actionButtonStyle('#ef4444'),
                                                padding: '0.6rem 1.2rem',
                                                marginLeft: '1rem'
                                            }}
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                    <div style={cardStyle}>
                        <h2 style={{
                            color: 'var(--text)',
                            marginBottom: '1.5rem',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>📄</span> Ders Notları
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {notes.map(note => (
                                <div
                                    key={note.id}
                                    style={{
                                        background: 'var(--background)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        border: '1px solid var(--border)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <Link href="/notes" style={{ textDecoration: 'none' }}>
                                                <h3 style={{
                                                    color: 'var(--text)',
                                                    marginBottom: '0.5rem',
                                                    fontSize: '1.1rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'color 0.2s'
                                                }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}
                                                >
                                                    {note.title}
                                                </h3>
                                            </Link>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                                <span style={{ fontWeight: '600', color: note.author.banned ? '#ef4444' : '#f97316' }}>
                                                    @{note.author.username}
                                                </span>
                                                {note.author.banned && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>(Banlı)</span>}
                                                {' · '}
                                                <span style={{ color: '#f97316' }}>{note.course?.name || 'Ders bulunamadı'}</span>
                                                {' · '}
                                                {new Date(note.createdAt).toLocaleString('tr-TR')}
                                            </div>
                                            <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
                                                {note.content ? note.content.substring(0, 200) : 'İçerik yok'}
                                                {note.content && note.content.length > 200 && '...'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteNote(e, note.id)}
                                            style={{
                                                ...actionButtonStyle('#ef4444'),
                                                padding: '0.6rem 1.2rem',
                                                marginLeft: '1rem'
                                            }}
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <div style={cardStyle}>
                        <h2 style={{
                            color: 'var(--text)',
                            marginBottom: '1.5rem',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>⚠️</span> Raporlar
                        </h2>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={tableHeaderStyle}>Raporlayan</th>
                                        <th style={tableHeaderStyle}>Neden</th>
                                        <th style={tableHeaderStyle}>İçerik</th>
                                        <th style={tableHeaderStyle}>Durum</th>
                                        <th style={tableHeaderStyle}>Tarih</th>
                                        <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(report => (
                                        <tr key={report.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ ...tableCellStyle, color: '#f97316', fontWeight: '600' }}>
                                                @{report.reporter.username}
                                            </td>
                                            <td style={tableCellStyle}>
                                                <span style={badgeStyle('#ef4444')}>
                                                    {report.reason}
                                                </span>
                                            </td>
                                            <td style={{ ...tableCellStyle, color: 'var(--text-secondary)', maxWidth: '300px' }}>
                                                {report.post ? (
                                                    <div>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>Post: </span>
                                                        <Link href={`/forum/${report.post.id}`} style={{ color: '#f97316' }}>
                                                            {report.post.title}
                                                        </Link>
                                                    </div>
                                                ) : report.reply ? (
                                                    <div>
                                                        <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>Reply in: </span>
                                                        <Link href={`/forum/${report.reply.post.id}`} style={{ color: '#f97316' }}>
                                                            {report.reply.post.title}
                                                        </Link>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                                            "{report.reply.content.substring(0, 50)}..."
                                                        </div>
                                                    </div>
                                                ) : 'Silinmiş İçerik'}
                                            </td>
                                            <td style={tableCellStyle}>
                                                <span style={badgeStyle(
                                                    report.status === 'PENDING' ? '#f97316' : report.status === 'RESOLVED' ? '#10b981' : '#6b7280'
                                                )}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td style={{ ...tableCellStyle, color: 'var(--text-secondary)' }}>
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                                {report.status === 'PENDING' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => handleUpdateReportStatus(report.id, 'RESOLVED')}
                                                            title="Çözüldü Olarak İşaretle"
                                                            style={actionButtonStyle('#10b981')}
                                                        >
                                                            ✅
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateReportStatus(report.id, 'DISMISSED')}
                                                            title="Reddet"
                                                            style={actionButtonStyle('#6b7280')}
                                                        >
                                                            ❌
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteModal.isOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            background: 'var(--secondary)',
                            padding: '2rem',
                            borderRadius: '20px',
                            maxWidth: '420px',
                            width: '90%',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                fontSize: '2rem'
                            }}>
                                ⚠️
                            </div>
                            <h3 style={{
                                color: 'var(--text)',
                                fontSize: '1.3rem',
                                marginBottom: '1rem',
                                textAlign: 'center',
                                fontWeight: '700'
                            }}>Onaylıyor musunuz?</h3>
                            <p style={{
                                color: 'var(--text-secondary)',
                                marginBottom: '2rem',
                                lineHeight: 1.6,
                                textAlign: 'center'
                            }}>
                                {deleteModal.title}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={closeDeleteModal}
                                    style={{
                                        padding: '0.9rem 1.8rem',
                                        background: 'transparent',
                                        color: 'var(--text)',
                                        border: '2px solid var(--border)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={executeDelete}
                                    style={{
                                        padding: '0.9rem 1.8rem',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
