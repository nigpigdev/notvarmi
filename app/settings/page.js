'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import universities from '@/lib/universities';
import departments from '@/lib/departments';
import ToggleSwitch from '@/components/ToggleSwitch';
import LoadingScreen from '@/components/LoadingScreen';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('profile');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        university: '',
        department: ''
    });

    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Security states
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [changingPassword, setChangingPassword] = useState(false);

    // Privacy states
    const [privacySettings, setPrivacySettings] = useState({
        profileVisible: true,
        allowMessages: true,
        showOnlineStatus: true
    });

    // Notification states
    const [notificationSettings, setNotificationSettings] = useState({
        notifyReplies: true,
        notifyMessages: true,
        notifyEmail: false
    });

    // Appearance states
    const [appearanceSettings, setAppearanceSettings] = useState({
        theme: 'system',
        language: 'tr'
    });

    // Session management states
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [terminatingAll, setTerminatingAll] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }
        if (session?.user) {
            fetchUserInfo();
            fetchPrivacySettings();
            fetchNotificationSettings();
            fetchAppearanceSettings();
            if (activeTab === 'security') {
                fetchSessions();
            }
        }
    }, [session, status, router, activeTab]);

    const fetchPrivacySettings = async () => {
        try {
            const res = await fetch('/api/settings/privacy');
            if (res.ok) {
                const data = await res.json();
                setPrivacySettings(data);
            }
        } catch (error) {
            console.error('Error fetching privacy settings:', error);
        }
    };

    const fetchNotificationSettings = async () => {
        try {
            const res = await fetch('/api/settings/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotificationSettings(data);
            }
        } catch (error) {
            console.error('Error fetching notification settings:', error);
        }
    };

    const fetchAppearanceSettings = async () => {
        try {
            const res = await fetch('/api/settings/appearance');
            if (res.ok) {
                const data = await res.json();
                setAppearanceSettings(data);
            }
        } catch (error) {
            console.error('Error fetching appearance settings:', error);
        }
    };

    const fetchUserInfo = async () => {
        try {
            const res = await fetch('/api/user-info');
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    username: data.username || '',
                    email: data.email || '',
                    university: data.university || '',
                    department: data.department || ''
                });
                if (data.avatar) {
                    setAvatarPreview(data.avatar);
                }
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Lütfen bir resim dosyası seçin');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
                return;
            }
            setAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('firstName', formData.firstName);
            formDataToSend.append('lastName', formData.lastName);
            formDataToSend.append('university', formData.university);
            formDataToSend.append('department', formData.department);
            if (avatar) {
                formDataToSend.append('avatar', avatar);
            }

            const res = await fetch('/api/profile', {
                method: 'PUT',
                body: formDataToSend,
            });

            if (res.ok) {
                const data = await res.json();
                alert('Ayarlarınız güncellendi.');
                if (data.avatar) {
                    setAvatarPreview(data.avatar);
                }
                setAvatar(null);
                // Force page reload to update session and navbar
                window.location.reload();
            } else {
                const err = await res.json();
                alert(`Güncelleme başarısız: ${err.error || 'Bilinmeyen hata'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Bir hata oluştu.');
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Yeni şifreler eşleşmiyor!');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            alert('Şifre en az 6 karakter olmalıdır!');
            return;
        }
        setChangingPassword(true);
        try {
            const res = await fetch('/api/settings/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Şifreniz başarıyla değiştirildi!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                alert(data.error || 'Şifre değiştirme başarısız!');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Bir hata oluştu!');
        } finally {
            setChangingPassword(false);
        }
    };

    const handlePrivacyToggle = async (field, value) => {
        const newSettings = { ...privacySettings, [field]: value };
        setPrivacySettings(newSettings);

        try {
            await fetch('/api/settings/privacy', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
        } catch (error) {
            console.error('Error updating privacy:', error);
            setPrivacySettings(privacySettings); // Revert on error
        }
    };

    const handleNotificationToggle = async (field, value) => {
        const newSettings = { ...notificationSettings, [field]: value };
        setNotificationSettings(newSettings);

        try {
            await fetch('/api/settings/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
        } catch (error) {
            console.error('Error updating notifications:', error);
            setNotificationSettings(notificationSettings); // Revert on error
        }
    };

    const handleThemeChange = async (theme) => {
        const newSettings = { ...appearanceSettings, theme };
        setAppearanceSettings(newSettings);

        try {
            await fetch('/api/settings/appearance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
            // TODO: Apply theme to document
        } catch (error) {
            console.error('Error updating theme:', error);
            setAppearanceSettings(appearanceSettings);
        }
    };

    const handleLanguageChange = async (language) => {
        const newSettings = { ...appearanceSettings, language };
        setAppearanceSettings(newSettings);

        try {
            await fetch('/api/settings/appearance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
        } catch (error) {
            console.error('Error updating language:', error);
            setAppearanceSettings(appearanceSettings);
        }
    };

    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await fetch('/api/sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        if (!confirm('Bu oturumu sonlandırmak istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const res = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('Oturum başarıyla sonlandırıldı!');
                fetchSessions(); // Refresh list
            } else {
                const data = await res.json();
                alert(data.error || 'Oturum sonlandırma başarısız!');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Bir hata oluştu!');
        }
    };

    const handleTerminateAllSessions = async () => {
        if (!confirm('Tüm oturumları sonlandırmak istediğinizden emin misiniz? Bu işlemden sonra tekrar giriş yapmanız gerekecek.')) {
            return;
        }

        if (!confirm('SON UYARI: Tüm cihazlardaki oturumlarınız sonlandırılacak! Devam etmek istiyor musunuz?')) {
            return;
        }

        setTerminatingAll(true);
        try {
            const res = await fetch('/api/sessions/terminate-all', {
                method: 'POST'
            });

            if (res.ok) {
                alert('Tüm oturumlar sonlandırıldı. Yeniden giriş yapmanız gerekiyor.');
                // Sign out and redirect
                await signOut({ redirect: false });
                window.location.href = '/login?t=' + Date.now();
            } else {
                const data = await res.json();
                alert(data.error || 'Oturum sonlandırma başarısız!');
            }
        } catch (error) {
            console.error('Error terminating all sessions:', error);
            alert('Bir hata oluştu!');
        } finally {
            setTerminatingAll(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Hesabınızı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
            return;
        }

        if (!confirm('SON UYARI: Tüm verileriniz silinecek ve bu işlem geri alınamayacak! Devam etmek istiyor musunuz?')) {
            return;
        }

        try {
            const res = await fetch('/api/settings/account', {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('Hesabınız silindi. Hoşçakalın!');
                // Sign out without automatic redirect to allow session state to clear first
                await signOut({ redirect: false });
                // Force a full page refresh to home page
                window.location.href = '/';
            } else {
                const data = await res.json();
                alert(data.error || 'Hesap silme başarısız!');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Bir hata oluştu!');
        }
    };

    const tabs = [
        { id: 'profile', icon: '👤', label: 'Profil' },
        { id: 'security', icon: '🔒', label: 'Güvenlik' },
        { id: 'privacy', icon: '👁️', label: 'Gizlilik' },
        { id: 'notifications', icon: '🔔', label: 'Bildirimler' },
        { id: 'appearance', icon: '🎨', label: 'Görünüm' },
        { id: 'account', icon: '⚙️', label: 'Hesap' },
    ];

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ marginBottom: '2rem', color: 'var(--text)', fontSize: '2rem' }}>Ayarlar</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Sidebar */}
                <div style={{
                    background: 'var(--secondary)',
                    borderRadius: '16px',
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    position: 'sticky',
                    top: '2rem'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                width: '100%',
                                padding: '0.9rem 1.2rem',
                                marginBottom: '0.5rem',
                                background: activeTab === tab.id ? 'var(--accent-purple)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text)',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: activeTab === tab.id ? '600' : '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                transition: 'all 0.2s',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== tab.id) {
                                    e.currentTarget.style.background = 'var(--hover-bg)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== tab.id) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.3rem' }}>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{
                    background: 'var(--secondary)',
                    borderRadius: '16px',
                    padding: '2rem',
                    border: '1px solid var(--border)',
                    minHeight: '500px'
                }}>
                    {activeTab === 'profile' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)', fontSize: '1.5rem' }}>Profil Ayarları</h2>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Avatar Section */}
                                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: '50%',
                                            margin: '0 auto',
                                            overflow: 'hidden',
                                            border: '3px solid var(--accent-blue)',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            backgroundColor: 'var(--background)',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '3rem',
                                                color: 'var(--text-secondary)',
                                                backgroundColor: 'var(--background)',
                                            }}>
                                                {formData.firstName ? formData.firstName[0].toUpperCase() : '?'}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            marginTop: '1rem',
                                            padding: '0.5rem 1rem',
                                            backgroundColor: 'var(--secondary)',
                                            color: 'var(--accent-purple)',
                                            border: '1px solid rgba(139, 92, 246, 0.3)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        Fotoğraf Değiştir
                                    </button>
                                </div>

                                {/* Name Fields */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                            İsim
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                backgroundColor: 'var(--background)',
                                                color: 'var(--text)',
                                                fontSize: '1rem',
                                                outline: 'none',
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                            Soyisim
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                backgroundColor: 'var(--background)',
                                                color: 'var(--text)',
                                                fontSize: '1rem',
                                                outline: 'none',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Username Field */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                        Kullanıcı Adı
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: '0.8rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-secondary)',
                                            fontWeight: 'bold'
                                        }}>@</span>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            disabled
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem 0.8rem 0.8rem 2rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                backgroundColor: 'var(--background)',
                                                color: 'var(--text-secondary)',
                                                fontSize: '1rem',
                                                cursor: 'not-allowed',
                                                opacity: 0.7,
                                            }}
                                        />
                                    </div>
                                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Kullanıcı adı değiştirilemez</small>
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                        E-posta
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--text-secondary)',
                                            fontSize: '1rem',
                                            cursor: 'not-allowed',
                                            opacity: 0.7,
                                        }}
                                    />
                                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>E-posta adresi değiştirilemez</small>
                                </div>

                                {/* University & Department */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                        Üniversite
                                    </label>
                                    <select
                                        name="university"
                                        value={formData.university}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--text)',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Üniversite seçiniz</option>
                                        {universities.map(uni => (
                                            <option key={uni} value={uni}>{uni}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                        Bölüm
                                    </label>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--text)',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Bölüm seçiniz</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={updating}
                                    style={{
                                        padding: '0.9rem 1.5rem',
                                        backgroundColor: 'var(--accent-purple)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: updating ? 'not-allowed' : 'pointer',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        opacity: updating ? 0.7 : 1,
                                        transition: 'all 0.2s ease',
                                        marginTop: '0.5rem',
                                    }}
                                >
                                    {updating ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)', fontSize: '1.5rem' }}>Güvenlik</h2>

                            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                        Mevcut Şifre
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--text)',
                                            fontSize: '1rem',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                        Yeni Şifre
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--text)',
                                            fontSize: '1rem',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: '500' }}>
                                        Yeni Şifre (Tekrar)
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--text)',
                                            fontSize: '1rem',
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    style={{
                                        padding: '0.9rem 1.5rem',
                                        backgroundColor: 'var(--accent-blue)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: changingPassword ? 'not-allowed' : 'pointer',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        opacity: changingPassword ? 0.7 : 1,
                                    }}
                                >
                                    {changingPassword ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                                </button>
                            </form>

                            <div style={{
                                borderTop: '1px solid var(--border)',
                                paddingTop: '1.5rem',
                                marginTop: '2rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, marginBottom: '0.3rem', color: 'var(--text)', fontSize: '1.2rem' }}>Oturum Güvenliği</h3>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            Tüm cihazlardaki aktif oturumlarınızı yönetin
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleTerminateAllSessions}
                                        disabled={terminatingAll || sessions.length === 0}
                                        style={{
                                            padding: '0.7rem 1.2rem',
                                            backgroundColor: '#ff4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: (terminatingAll || sessions.length === 0) ? 'not-allowed' : 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            opacity: (terminatingAll || sessions.length === 0) ? 0.5 : 1,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {terminatingAll ? 'Sonlandırılıyor...' : 'Tüm Oturumları Sonlandır'}
                                    </button>
                                </div>

                                {loadingSessions ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                        Oturumlar yükleniyor...
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                        Aktif oturum bulunamadı
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {sessions.map((session, index) => {
                                            const isRecent = index === 0; // Most recent session is likely current
                                            const lastActiveDate = new Date(session.lastActive);
                                            const now = new Date();
                                            const diffMinutes = Math.floor((now - lastActiveDate) / 1000 / 60);

                                            let timeAgo;
                                            if (diffMinutes < 1) timeAgo = 'Şimdi';
                                            else if (diffMinutes < 60) timeAgo = `${diffMinutes} dakika önce`;
                                            else if (diffMinutes < 1440) timeAgo = `${Math.floor(diffMinutes / 60)} saat önce`;
                                            else timeAgo = `${Math.floor(diffMinutes / 1440)} gün önce`;

                                            return (
                                                <div
                                                    key={session.id}
                                                    style={{
                                                        padding: '1.2rem',
                                                        background: 'var(--background)',
                                                        borderRadius: '12px',
                                                        border: isRecent ? '2px solid var(--accent-green)' : '1px solid var(--border)',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {isRecent && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '0.8rem',
                                                            right: '0.8rem',
                                                            padding: '0.3rem 0.7rem',
                                                            background: 'var(--accent-green)',
                                                            color: 'white',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            ✓ Mevcut Oturum
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontSize: '1.3rem' }}>🖥️</span>
                                                            <div>
                                                                <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '1rem' }}>
                                                                    {session.os} • {session.browser}
                                                                </div>
                                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                                    {session.device}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                            <span>📍</span>
                                                            <span>{session.city}, {session.region}, {session.country}</span>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                            <span>🌐</span>
                                                            <span>{session.ipAddress}</span>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                            <span>🕐</span>
                                                            <span>Son aktif: {timeAgo}</span>
                                                        </div>

                                                        {!isRecent && (
                                                            <button
                                                                onClick={() => handleDeleteSession(session.id)}
                                                                style={{
                                                                    marginTop: '0.5rem',
                                                                    padding: '0.6rem 1rem',
                                                                    backgroundColor: 'transparent',
                                                                    color: '#ff4444',
                                                                    border: '1px solid #ff4444',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: '500',
                                                                    transition: 'all 0.2s',
                                                                    width: '100%'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#ff4444';
                                                                    e.currentTarget.style.color = 'white';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                    e.currentTarget.style.color = '#ff4444';
                                                                }}
                                                            >
                                                                ❌ Bu Oturumu Sonlandır
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)', fontSize: '1.5rem' }}>Gizlilik Ayarları</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{
                                    padding: '1.2rem',
                                    background: 'var(--background)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, marginBottom: '0.3rem', color: 'var(--text)' }}>Profil Görünürlüğü</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                Profilinizi herkes görebilir
                                            </p>
                                        </div>
                                        <ToggleSwitch
                                            checked={privacySettings.profileVisible}
                                            onChange={(value) => handlePrivacyToggle('profileVisible', value)}
                                        />
                                    </div>
                                </div>

                                {/* Only show these settings if profile is visible */}
                                {privacySettings.profileVisible && (
                                    <>
                                        <div style={{
                                            padding: '1.2rem',
                                            background: 'var(--background)',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, marginBottom: '0.3rem', color: 'var(--text)' }}>Mesaj İzinleri</h4>
                                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                        Herkes size mesaj gönderebilir
                                                    </p>
                                                </div>
                                                <ToggleSwitch
                                                    checked={privacySettings.allowMessages}
                                                    onChange={(value) => handlePrivacyToggle('allowMessages', value)}
                                                />
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1.2rem',
                                            background: 'var(--background)',
                                            borderRadius: '10px',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, marginBottom: '0.3rem', color: 'var(--text)' }}>Çevrimiçi Durumu</h4>
                                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                        Çevrimiçi olduğunuzda göster
                                                    </p>
                                                </div>
                                                <ToggleSwitch
                                                    checked={privacySettings.showOnlineStatus}
                                                    onChange={(value) => handlePrivacyToggle('showOnlineStatus', value)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!privacySettings.profileVisible && (
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'var(--background)',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            Profil gizliliği aktif olduğunda mesaj ve çevrimiçi durumu ayarları devre dışıdır
                                        </p>
                                    </div>
                                )}

                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                    ✅ Gizlilik ayarları aktif ve otomatik kaydediliyor
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)', fontSize: '1.5rem' }}>Bildirim Tercihleri</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{
                                    padding: '1.2rem',
                                    background: 'var(--background)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, marginBottom: '0.3rem', color: 'var(--text)' }}>Yanıt Bildirimleri</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                Gönderilerinize yanıt geldiğinde bildir
                                            </p>
                                        </div>
                                        <ToggleSwitch
                                            checked={notificationSettings.notifyReplies}
                                            onChange={(value) => handleNotificationToggle('notifyReplies', value)}
                                        />
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.2rem',
                                    background: 'var(--background)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, marginBottom: '0.3rem', color: 'var(--text)' }}>Mesaj Bildirimleri</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                Yeni mesaj aldığınızda bildir
                                            </p>
                                        </div>
                                        <ToggleSwitch
                                            checked={notificationSettings.notifyMessages}
                                            onChange={(value) => handleNotificationToggle('notifyMessages', value)}
                                        />
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.2rem',
                                    background: 'var(--background)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, marginBottom: '0.3rem', color: 'var(--text)' }}>E-posta Bildirimleri</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                Önemli bildirimleri e-posta ile al
                                            </p>
                                        </div>
                                        <ToggleSwitch
                                            checked={notificationSettings.notifyEmail}
                                            onChange={(value) => handleNotificationToggle('notifyEmail', value)}
                                        />
                                    </div>
                                </div>

                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                    ✅ Bildirim tercihleri aktif ve otomatik kaydediliyor
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)', fontSize: '1.5rem' }}>Görünüm Ayarları</h2>

                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--text)', fontSize: '1.1rem' }}>Tema</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    {['light', 'dark', 'system'].map((themeValue, idx) => {
                                        const themeLabels = { light: 'Açık', dark: 'Koyu', system: 'Sistem' };
                                        const themeIcons = { light: '☀️', dark: '🌙', system: '💻' };
                                        const isActive = appearanceSettings.theme === themeValue;

                                        return (
                                            <div
                                                key={themeValue}
                                                onClick={() => handleThemeChange(themeValue)}
                                                style={{
                                                    padding: '1.5rem',
                                                    background: 'var(--background)',
                                                    border: `2px solid ${isActive ? 'var(--accent-purple)' : 'var(--border)'}`,
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    transition: 'all 0.2s',
                                                    position: 'relative'
                                                }}
                                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = 'var(--accent-purple)'; }}
                                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'; }}
                                            >
                                                {isActive && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '0.5rem',
                                                        right: '0.5rem',
                                                        color: 'var(--accent-purple)',
                                                        fontSize: '1.2rem'
                                                    }}>✓</div>
                                                )}
                                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                                    {themeIcons[themeValue]}
                                                </div>
                                                <div style={{ color: 'var(--text)', fontWeight: isActive ? '600' : '500' }}>
                                                    {themeLabels[themeValue]}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--text)', fontSize: '1.1rem' }}>Dil</h3>
                                <select
                                    value={appearanceSettings.language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="tr">Türkçe</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '2rem' }}>
                                ✅ Görünüm ayarları aktif ve otomatik kaydediliyor
                            </p>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)', fontSize: '1.5rem' }}>Hesap Yönetimi</h2>

                            <div style={{
                                padding: '1.5rem',
                                background: 'var(--background)',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                marginBottom: '2rem'
                            }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--text)', fontSize: '1.1rem' }}>Hesap Bilgileri</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Hesap Oluşturma:</span>
                                        <span style={{ fontWeight: '500', color: 'var(--text)' }}>
                                            {session?.user?.createdAt ? new Date(session.user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Kullanıcı ID:</span>
                                        <span style={{ fontWeight: '500', color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                            {session?.user?.id || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                padding: '1.5rem',
                                background: '#fef2f2',
                                borderRadius: '12px',
                                border: '1px solid #fecaca'
                            }}>
                                <h3 style={{ marginBottom: '1rem', color: '#991b1b', fontSize: '1.1rem' }}>Tehlikeli Bölge</h3>
                                <p style={{ color: '#7f1d1d', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    Hesabınızı kalıcı olarak silmek isterseniz, tüm verileriniz silinecektir. Bu işlem geri alınamaz.
                                </p>
                                <button
                                    onClick={handleDeleteAccount}
                                    style={{
                                        padding: '0.7rem 1.2rem',
                                        backgroundColor: '#dc2626',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                    }}
                                >
                                    Hesabı Sil
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
