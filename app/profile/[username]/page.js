'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Image from 'next/image';

export default function UserProfile({ params }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useLanguage();
    const { username } = use(params);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'replies'
    const [isEditingCover, setIsEditingCover] = useState(false);
    const [coverType, setCoverType] = useState(null); // 'color' or 'image'
    const [selectedColor, setSelectedColor] = useState('#764ba2');
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveCover = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            if (coverType === 'color') {
                formData.append('coverColor', selectedColor);
            } else if (coverType === 'image' && selectedImage) {
                formData.append('coverImage', selectedImage);
            }

            const res = await fetch('/api/profile', {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setProfileData(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        coverColor: data.coverColor,
                        coverImage: data.coverImage
                    }
                }));
                setIsEditingCover(false);
                setCoverType(null);
                setSelectedImage(null);
                setPreviewUrl(null);
            }
        } catch (error) {
            console.error('Error updating cover:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAvatar = async () => {
        if (!selectedAvatar) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('avatar', selectedAvatar);

            const res = await fetch('/api/profile', {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setProfileData(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        avatar: data.avatar
                    }
                }));
                setIsEditingAvatar(false);
                setSelectedAvatar(null);
                setAvatarPreview(null);
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            console.log('Fetching profile for username:', username);
            try {
                const res = await fetch(`/api/users/${username}`);
                if (res.ok) {
                    const data = await res.json();
                    setProfileData(data);
                } else {
                    console.error('Failed to fetch profile:', res.status, res.statusText);
                    try {
                        const errorData = await res.json();
                        console.error('Error details:', errorData);
                    } catch (e) {
                        console.error('Could not parse error response');
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        if (status === 'authenticated' && username) {
            fetchProfile();
        }
    }, [status, username]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (!profileData) {
        return (
            <div style={{
                maxWidth: '1200px',
                margin: '2rem auto',
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text)'
            }}>
                <h1>Kullanıcı bulunamadı</h1>
            </div>
        );
    }

    const { user, posts, replies, isPrivate } = profileData;

    // Calculate user's document count (PDF files) and total views
    const userDocuments = posts.reduce((count, post) => {
        if (post.fileUrls) {
            try {
                const files = JSON.parse(post.fileUrls);
                return count + files.filter(url => url.toLowerCase().endsWith('.pdf')).length;
            } catch (e) {
                return count;
            }
        }
        return count;
    }, 0);

    const userTotalViews = posts.reduce((total, post) => total + (post.viewCount || 0), 0);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--background)',
            padding: isMobile ? '1rem 0.5rem' : '2rem 1rem',
            transition: 'background-color 0.3s ease'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <Link href="/topluluk" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '2rem',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    background: 'var(--secondary)',
                    border: '1px solid var(--border)'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#f97316';
                        e.currentTarget.style.borderColor = '#f97316';
                        e.currentTarget.style.transform = 'translateX(-4px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'translateX(0)';
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Topluluğa Dön
                </Link>

                {/* Profile Card */}
                <div style={{
                    background: 'var(--secondary)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                    marginBottom: '2rem',
                    border: '1px solid var(--border)'
                }}>
                    {/* Cover Image */}
                    <div style={{
                        height: isMobile ? '150px' : '250px',
                        background: previewUrl
                            ? `url(${previewUrl}) center/cover no-repeat`
                            : user.coverImage
                                ? `url(${user.coverImage}) center/cover no-repeat`
                                : user.coverColor
                                    ? user.coverColor
                                    : 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                        position: 'relative',
                        transition: 'background 0.3s ease'
                    }}>
                        {!user.coverImage && !previewUrl && !user.coverColor && (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                                opacity: 0.3
                            }}></div>
                        )}

                        {/* Edit Cover Button */}
                        {session?.user?.username === user.username && (
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                zIndex: 10
                            }}>
                                {!isEditingCover ? (
                                    <button
                                        onClick={() => setIsEditingCover(true)}
                                        style={{
                                            background: 'rgba(0,0,0,0.6)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50px',
                                            padding: '0.5rem 1rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            backdropFilter: 'blur(4px)',
                                            transition: 'all 0.2s',
                                            fontSize: '0.9rem',
                                            fontWeight: '500'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                                    >
                                        <span>✏️</span> Düzenle
                                    </button>
                                ) : (
                                    <div style={{
                                        background: 'var(--secondary)',
                                        padding: '1rem',
                                        borderRadius: '15px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                        border: '1px solid var(--border)',
                                        minWidth: '250px',
                                        animation: 'fadeIn 0.2s ease'
                                    }}>
                                        <div style={{ marginBottom: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>Kapak Düzenle</div>

                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <button
                                                onClick={() => { setCoverType('color'); setPreviewUrl(null); }}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    border: coverType === 'color' ? '2px solid #f97316' : '1px solid var(--border)',
                                                    background: coverType === 'color' ? 'var(--hover-bg)' : 'transparent',
                                                    color: 'var(--text)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Renk
                                            </button>
                                            <button
                                                onClick={() => setCoverType('image')}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    border: coverType === 'image' ? '2px solid #f97316' : '1px solid var(--border)',
                                                    background: coverType === 'image' ? 'var(--hover-bg)' : 'transparent',
                                                    color: 'var(--text)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Resim
                                            </button>
                                        </div>

                                        {coverType === 'color' && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <input
                                                    type="color"
                                                    value={selectedColor}
                                                    onChange={(e) => {
                                                        setSelectedColor(e.target.value);
                                                        setPreviewUrl(null); // Clear image preview
                                                        // Update parent div background immediately for preview
                                                        // Note: This is handled by the parent style prop using 'coverColor' logic if we were updating state directly, 
                                                        // but here we might want to set a temporary preview state for color too.
                                                        // For simplicity, we'll just rely on the color picker for now or add a preview box.
                                                    }}
                                                    style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', borderRadius: '8px' }}
                                                />
                                            </div>
                                        )}

                                        {coverType === 'image' && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <input
                                                    type="file"
                                                    id="cover-file-input"
                                                    accept="image/*"
                                                    onChange={handleImageSelect}
                                                    style={{ display: 'none' }}
                                                />
                                                <label
                                                    htmlFor="cover-file-input"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.6rem 1rem',
                                                        background: 'var(--background)',
                                                        border: '1px dashed var(--border)',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        fontSize: '0.85rem',
                                                        color: 'var(--text-secondary)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = '#f97316';
                                                        e.currentTarget.style.color = '#f97316';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                                    }}
                                                >
                                                    <span>📁</span>
                                                    <span>{selectedImage ? selectedImage.name : 'Resim Seç'}</span>
                                                </label>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={handleSaveCover}
                                                disabled={isSaving || (!selectedImage && coverType === 'image')}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    opacity: isSaving ? 0.7 : 1
                                                }}
                                            >
                                                {isSaving ? '...' : 'Kaydet'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingCover(false);
                                                    setCoverType(null);
                                                    setPreviewUrl(null);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    background: 'transparent',
                                                    color: 'var(--text-secondary)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                İptal
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div style={{ padding: isMobile ? '0 1rem 1rem' : '0 2rem 2rem', position: 'relative' }}>
                        {/* Avatar */}
                        <div style={{
                            marginTop: isMobile ? '-50px' : '-80px',
                            marginBottom: isMobile ? '1rem' : '1.5rem',
                            position: 'relative',
                            width: isMobile ? '100px' : '160px'
                        }}>
                            <div
                                style={{
                                    position: 'relative',
                                    width: isMobile ? '100px' : '160px',
                                    height: isMobile ? '100px' : '160px',
                                    cursor: session?.user?.username === user.username ? 'pointer' : 'default'
                                }}
                                onClick={() => {
                                    if (session?.user?.username === user.username) {
                                        setIsEditingAvatar(true);
                                    }
                                }}
                            >
                                {avatarPreview ? (
                                    <div style={{
                                        width: isMobile ? '100px' : '160px',
                                        height: isMobile ? '100px' : '160px',
                                        borderRadius: '50%',
                                        border: isMobile ? '4px solid var(--secondary)' : '6px solid var(--secondary)',
                                        overflow: 'hidden',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                        background: 'var(--secondary)'
                                    }}>
                                        <img
                                            src={avatarPreview}
                                            alt="Preview"
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                        />
                                    </div>
                                ) : user.avatar ? (
                                    <div style={{
                                        width: isMobile ? '100px' : '160px',
                                        height: isMobile ? '100px' : '160px',
                                        borderRadius: '50%',
                                        border: isMobile ? '4px solid var(--secondary)' : '6px solid var(--secondary)',
                                        overflow: 'hidden',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                        background: 'var(--secondary)'
                                    }}>
                                        <Image
                                            src={user.avatar}
                                            alt={user.name || user.username}
                                            width={160}
                                            height={160}
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{
                                        width: isMobile ? '100px' : '160px',
                                        height: isMobile ? '100px' : '160px',
                                        borderRadius: '50%',
                                        border: isMobile ? '4px solid var(--secondary)' : '6px solid var(--secondary)',
                                        background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: isMobile ? '2.5rem' : '4rem',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                        color: 'white'
                                    }}>
                                        {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                                    </div>
                                )}

                                {/* Hover Overlay with Edit Icon */}
                                {session?.user?.username === user.username && !isEditingAvatar && (
                                    <div
                                        className="avatar-edit-overlay"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: isMobile ? '100px' : '160px',
                                            height: isMobile ? '100px' : '160px',
                                            borderRadius: '50%',
                                            background: 'rgba(0,0,0,0)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'background 0.3s ease',
                                            fontSize: '2.5rem',
                                            color: 'white',
                                            opacity: 0,
                                            pointerEvents: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(0,0,0,0)';
                                            e.currentTarget.style.opacity = '0';
                                        }}
                                    >
                                        ✏️
                                    </div>
                                )}
                            </div>

                            {/* Edit Avatar Modal */}
                            {isEditingAvatar && session?.user?.username === user.username && (
                                <div style={{
                                    position: 'absolute',
                                    top: '170px',
                                    left: '0',
                                    background: 'var(--secondary)',
                                    padding: '1rem',
                                    borderRadius: '15px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border)',
                                    minWidth: '220px',
                                    zIndex: 100
                                }}>
                                    <div style={{ marginBottom: '0.75rem', fontWeight: 'bold', color: 'var(--text)', fontSize: '0.9rem' }}>Profil Fotoğrafı</div>

                                    <input
                                        type="file"
                                        id="avatar-file-input"
                                        accept="image/*"
                                        onChange={handleAvatarSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <label
                                        htmlFor="avatar-file-input"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            padding: '0.6rem 1rem',
                                            background: 'var(--background)',
                                            border: '1px dashed var(--border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: '0.85rem',
                                            color: 'var(--text-secondary)',
                                            marginBottom: '0.75rem'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#f97316';
                                            e.currentTarget.style.color = '#f97316';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }}
                                    >
                                        <span>📁</span>
                                        <span>{selectedAvatar ? selectedAvatar.name : 'Fotoğraf Seç'}</span>
                                    </label>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={handleSaveAvatar}
                                            disabled={isSaving || !selectedAvatar}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: isSaving || !selectedAvatar ? 'not-allowed' : 'pointer',
                                                opacity: isSaving || !selectedAvatar ? 0.5 : 1,
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {isSaving ? '...' : 'Kaydet'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditingAvatar(false);
                                                setSelectedAvatar(null);
                                                setAvatarPreview(null);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            İptal
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Details */}
                        <h1 style={{
                            fontSize: isMobile ? '1.75rem' : '2.5rem',
                            marginBottom: '0.5rem',
                            color: 'var(--text)',
                            fontWeight: 'bold'
                        }}>
                            {user.name || user.username}
                        </h1>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: isMobile ? '0.95rem' : '1.1rem',
                            marginBottom: isMobile ? '1rem' : '1.5rem',
                            fontWeight: '500'
                        }}>
                            @{user.username}
                        </p>

                        {/* Info Tags */}
                        <div style={{
                            display: 'flex',
                            gap: isMobile ? '0.5rem' : '1rem',
                            flexWrap: 'wrap',
                            marginBottom: isMobile ? '1rem' : '1.5rem'
                        }}>
                            {user.university && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                                    borderRadius: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: '600',
                                    fontSize: isMobile ? '0.85rem' : '1rem',
                                    boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)'
                                }}>
                                    <span>🏫</span>
                                    <span>{user.university}</span>
                                </div>
                            )}
                            {user.department && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    color: 'white',
                                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                                    borderRadius: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: '600',
                                    fontSize: isMobile ? '0.85rem' : '1rem',
                                    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
                                }}>
                                    <span>📚</span>
                                    <span>{user.department}</span>
                                </div>
                            )}
                        </div>

                        {/* DM Button */}
                        {session?.user?.username !== user.username && user.allowMessages && !isPrivate && (
                            <Link
                                href={`/messages/${user.id}`}
                                style={{
                                    padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                                    background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '0.9rem' : '1rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    textDecoration: 'none',
                                    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(249, 115, 22, 0.4)';
                                }}>
                                💬 Mesaj Gönder
                            </Link>
                        )}
                    </div>
                </div>

                {/* Private Profile Message */}
                {isPrivate && (
                    <div style={{
                        background: 'var(--secondary)',
                        borderRadius: '24px',
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                        border: '1px solid var(--border)',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 2rem',
                            fontSize: '3.5rem',
                            boxShadow: '0 10px 30px rgba(118, 75, 162, 0.3)'
                        }}>
                            🔒
                        </div>
                        <h2 style={{
                            fontSize: '2rem',
                            marginBottom: '1rem',
                            color: 'var(--text)',
                            fontWeight: 'bold'
                        }}>
                            Bu Hesap Gizli
                        </h2>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '1.1rem',
                            maxWidth: '500px',
                            margin: '0 auto',
                            lineHeight: '1.6'
                        }}>
                            Bu kullanıcı profilini gizli olarak ayarlamış. Paylaşımlarını ve yanıtlarını göremezsiniz.
                        </p>
                    </div>
                )}

                {/* Stats Cards */}
                {!isPrivate && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                        gap: isMobile ? '1rem' : '1.5rem',
                        marginBottom: isMobile ? '1rem' : '2rem'
                    }}>
                        <div style={{
                            background: 'var(--secondary)',
                            borderRadius: isMobile ? '16px' : '20px',
                            padding: isMobile ? '1.5rem' : '2rem',
                            textAlign: 'center',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s ease',
                            border: '1px solid var(--border)'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.12)';
                                e.currentTarget.style.borderColor = '#f97316';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }}>
                            <div style={{
                                width: isMobile ? '50px' : '60px',
                                height: isMobile ? '50px' : '60px',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem',
                                fontSize: isMobile ? '1.5rem' : '1.8rem',
                                color: 'white'
                            }}>
                                📝
                            </div>
                            <div style={{
                                fontSize: isMobile ? '2rem' : '2.5rem',
                                fontWeight: 'bold',
                                color: '#f97316',
                                marginBottom: '0.5rem'
                            }}>
                                {posts.length}
                            </div>
                            <div style={{
                                color: 'var(--text-secondary)',
                                fontSize: isMobile ? '0.85rem' : '1rem',
                                fontWeight: '600'
                            }}>
                                Tartışmalar
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--secondary)',
                            borderRadius: isMobile ? '16px' : '20px',
                            padding: isMobile ? '1.5rem' : '2rem',
                            textAlign: 'center',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s ease',
                            border: '1px solid var(--border)'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.12)';
                                e.currentTarget.style.borderColor = 'var(--accent-blue)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }}>
                            <div style={{
                                width: isMobile ? '50px' : '60px',
                                height: isMobile ? '50px' : '60px',
                                background: 'linear-gradient(135deg, var(--accent-blue) 0%, #00f2fe 100%)',
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem',
                                fontSize: isMobile ? '1.5rem' : '1.8rem',
                                color: 'white'
                            }}>
                                💬
                            </div>
                            <div style={{
                                fontSize: isMobile ? '2rem' : '2.5rem',
                                fontWeight: 'bold',
                                color: 'var(--accent-blue)',
                                marginBottom: '0.5rem'
                            }}>
                                {replies.length}
                            </div>
                            <div style={{
                                color: 'var(--text-secondary)',
                                fontSize: isMobile ? '0.85rem' : '1rem',
                                fontWeight: '600'
                            }}>
                                Yanıtlar
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--secondary)',
                            borderRadius: isMobile ? '16px' : '20px',
                            padding: isMobile ? '1.5rem' : '2rem',
                            textAlign: 'center',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s ease',
                            border: '1px solid var(--border)'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.12)';
                                e.currentTarget.style.borderColor = '#14b8a6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }}>
                            <div style={{
                                width: isMobile ? '50px' : '60px',
                                height: isMobile ? '50px' : '60px',
                                background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem',
                                fontSize: isMobile ? '1.5rem' : '1.8rem',
                                color: 'white'
                            }}>
                                📄
                            </div>
                            <div style={{
                                fontSize: isMobile ? '2rem' : '2.5rem',
                                fontWeight: 'bold',
                                color: '#14b8a6',
                                marginBottom: '0.5rem'
                            }}>
                                {userDocuments}
                            </div>
                            <div style={{
                                color: 'var(--text-secondary)',
                                fontSize: isMobile ? '0.85rem' : '1rem',
                                fontWeight: '600'
                            }}>
                                Dosyalar
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--secondary)',
                            borderRadius: isMobile ? '16px' : '20px',
                            padding: isMobile ? '1.5rem' : '2rem',
                            textAlign: 'center',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s ease',
                            border: '1px solid var(--border)'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.12)';
                                e.currentTarget.style.borderColor = '#3b82f6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }}>
                            <div style={{
                                width: isMobile ? '50px' : '60px',
                                height: isMobile ? '50px' : '60px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem',
                                fontSize: isMobile ? '1.5rem' : '1.8rem',
                                color: 'white'
                            }}>
                                👁️
                            </div>
                            <div style={{
                                fontSize: isMobile ? '2rem' : '2.5rem',
                                fontWeight: 'bold',
                                color: '#3b82f6',
                                marginBottom: '0.5rem'
                            }}>
                                {userTotalViews}
                            </div>
                            <div style={{
                                color: 'var(--text-secondary)',
                                fontSize: isMobile ? '0.85rem' : '1rem',
                                fontWeight: '600'
                            }}>
                                Görüntülenmeler
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                {!isPrivate && (
                    <div style={{
                        background: 'var(--secondary)',
                        borderRadius: isMobile ? '16px' : '20px',
                        padding: isMobile ? '1rem' : '1.5rem',
                        marginBottom: isMobile ? '1rem' : '1.5rem',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        display: 'flex',
                        gap: isMobile ? '0.5rem' : '1rem',
                        border: '1px solid var(--border)'
                    }}>
                        <button
                            onClick={() => setActiveTab('posts')}
                            style={{
                                flex: 1,
                                padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
                                background: activeTab === 'posts'
                                    ? 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)'
                                    : 'transparent',
                                color: activeTab === 'posts' ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: isMobile ? '12px' : '15px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: isMobile ? '0.85rem' : '1rem',
                                transition: 'all 0.3s ease',
                                boxShadow: activeTab === 'posts' ? '0 5px 20px rgba(249, 115, 22, 0.4)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== 'posts') {
                                    e.currentTarget.style.background = 'var(--background)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== 'posts') {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}>
                            📝 Tartışmalar ({posts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('replies')}
                            style={{
                                flex: 1,
                                padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
                                background: activeTab === 'replies'
                                    ? 'linear-gradient(135deg, var(--accent-blue) 0%, #00f2fe 100%)'
                                    : 'transparent',
                                color: activeTab === 'replies' ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: isMobile ? '12px' : '15px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: isMobile ? '0.85rem' : '1rem',
                                transition: 'all 0.3s ease',
                                boxShadow: activeTab === 'replies' ? '0 5px 20px rgba(79, 172, 254, 0.4)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== 'replies') {
                                    e.currentTarget.style.background = 'var(--background)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== 'replies') {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}>
                            💬 Yanıtlar ({replies.length})
                        </button>
                    </div>
                )}

                {/* Content */}
                {activeTab === 'posts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {posts.length > 0 ? posts.map(post => (
                            <Link
                                key={post.id}
                                href={`/topluluk/${post.id}`}
                                style={{
                                    background: 'var(--secondary)',
                                    borderRadius: '20px',
                                    padding: '2rem',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                    border: '1px solid var(--border)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(249, 115, 22, 0.2)';
                                    e.currentTarget.style.borderColor = '#f97316';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                }}>
                                <h3 style={{
                                    color: 'var(--text)',
                                    fontSize: '1.4rem',
                                    marginBottom: '1rem',
                                    fontWeight: 'bold'
                                }}>
                                    {post.title}
                                </h3>
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '1rem',
                                    marginBottom: '1.5rem',
                                    lineHeight: '1.7'
                                }}>
                                    {post.content.substring(0, 150)}...
                                </p>
                                <div style={{
                                    display: 'flex',
                                    gap: '1.5rem',
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <span style={{
                                        background: 'var(--background)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '10px',
                                        fontWeight: '600'
                                    }}>💬 {post._count.replies} yanıt</span>
                                    <span style={{
                                        background: 'var(--background)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '10px',
                                        fontWeight: '600'
                                    }}>📅 {new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                            </Link>
                        )) : (
                            <div style={{
                                background: 'var(--secondary)',
                                borderRadius: '20px',
                                textAlign: 'center',
                                padding: '4rem',
                                color: 'var(--text-secondary)',
                                fontSize: '1.1rem',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                border: '1px solid var(--border)'
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                                Henüz tartışma yok
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'replies' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {replies.length > 0 ? replies.map(reply => (
                            <Link
                                key={reply.id}
                                href={`/topluluk/${reply.post.id}`}
                                style={{
                                    background: 'var(--secondary)',
                                    borderRadius: '20px',
                                    padding: '2rem',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                    border: '1px solid var(--border)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(79, 172, 254, 0.2)';
                                    e.currentTarget.style.borderColor = 'var(--accent-blue)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                }}>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '1rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span style={{
                                        background: 'linear-gradient(135deg, var(--accent-blue) 0%, #00f2fe 100%)',
                                        color: 'white',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem'
                                    }}>Yanıt</span>
                                    <span>{reply.post.title}</span>
                                </div>
                                <p style={{
                                    color: 'var(--text)',
                                    fontSize: '1.05rem',
                                    lineHeight: '1.7',
                                    marginBottom: '1rem'
                                }}>
                                    {reply.content.substring(0, 200)}...
                                </p>
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--background)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '10px',
                                    display: 'inline-block',
                                    fontWeight: '600'
                                }}>
                                    📅 {new Date(reply.createdAt).toLocaleDateString('tr-TR')}
                                </div>
                            </Link>
                        )) : (
                            <div style={{
                                background: 'var(--secondary)',
                                borderRadius: '20px',
                                textAlign: 'center',
                                padding: '4rem',
                                color: 'var(--text-secondary)',
                                fontSize: '1.1rem',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                border: '1px solid var(--border)'
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
                                Henüz yanıt yok
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}
