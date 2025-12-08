'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import universities from '@/lib/universities';
import departments from '@/lib/departments';
import { useAlert } from '@/contexts/AlertContext';

export default function RegisterClient() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        emailConfirm: '',
        university: '',
        department: '',
        password: '',
        passwordConfirm: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'username') {
            const cleanValue = value.toLowerCase().replace(/\s/g, '');
            setFormData(prev => ({ ...prev, [name]: cleanValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'İsim gerekli';
        if (!formData.lastName.trim()) newErrors.lastName = 'Soyisim gerekli';
        if (!formData.username.trim()) {
            newErrors.username = 'Kullanıcı adı gerekli';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Kullanıcı adı en az 3 karakter olmalı';
        } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Sadece küçük harf, rakam ve alt çizgi kullanılabilir';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'E-posta gerekli';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Geçerli bir e-posta adresi girin';
        }
        if (formData.email !== formData.emailConfirm) {
            newErrors.emailConfirm = 'E-posta adresleri eşleşmiyor';
        }
        if (!formData.university) newErrors.university = 'Üniversite seçiniz';
        if (!formData.department) newErrors.department = 'Bölüm seçiniz';
        if (!formData.password) {
            newErrors.password = 'Şifre gerekli';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Şifre en az 6 karakter olmalı';
        }
        if (formData.password !== formData.passwordConfirm) {
            newErrors.passwordConfirm = 'Şifreler eşleşmiyor';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    username: formData.username.trim().toLowerCase(),
                    email: formData.email.trim().toLowerCase(),
                    university: formData.university,
                    department: formData.department,
                    password: formData.password
                })
            });

            const data = await res.json();
            if (res.ok) {
                await showAlert('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
                router.push('/login');
            } else {
                setErrors({ submit: data.error || 'Kayıt başarısız oldu' });
            }
        } catch (error) {
            console.error('Registration error:', error);
            setErrors({ submit: 'Kayıt sırasında bir hata oluştu' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            backgroundColor: 'var(--background)'
        }}>


            <div style={{
                width: '100%',
                maxWidth: '700px',
                backgroundColor: 'var(--secondary)',
                borderRadius: '24px',
                padding: '3rem 2.5rem',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Icon */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
                }}>
                    ✨
                </div>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        marginBottom: '0.5rem',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: '700'
                    }}>
                        Kayıt Ol
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Topluluğa katıl ve öğrenmeye başla
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Name Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                👤 İsim *
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Adınız"
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${errors.firstName ? '#ef4444' : 'var(--border)'}`,
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    if (!errors.firstName) {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = errors.firstName ? '#ef4444' : 'var(--border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            {errors.firstName && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>⚠️ {errors.firstName}</span>}
                        </div>

                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                👤 Soyisim *
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Soyadınız"
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${errors.lastName ? '#ef4444' : 'var(--border)'}`,
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    if (!errors.lastName) {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = errors.lastName ? '#ef4444' : 'var(--border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            {errors.lastName && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>⚠️ {errors.lastName}</span>}
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem',
                            color: 'var(--text)',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>
                            @ Kullanıcı Adı *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)',
                                fontSize: '1rem',
                                pointerEvents: 'none'
                            }}>@</span>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="kullaniciadi"
                                style={{
                                    width: '100%',
                                    padding: '0.9rem 0.9rem 0.9rem 2.2rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${errors.username ? '#ef4444' : 'var(--border)'}`,
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    if (!errors.username) {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = errors.username ? '#ef4444' : 'var(--border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                        {errors.username && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>⚠️ {errors.username}</span>}
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                            💡 Sadece küçük harf, rakam ve alt çizgi (_)
                        </small>
                    </div>

                    {/* Email Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                📧 E-posta *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ornek@universite.edu.tr"
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${errors.email ? '#ef4444' : 'var(--border)'}`,
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    if (!errors.email) {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = errors.email ? '#ef4444' : 'var(--border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            {errors.email && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>⚠️ {errors.email}</span>}
                        </div>

                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                ✅ E-posta Tekrar *
                            </label>
                            <input
                                type="email"
                                name="emailConfirm"
                                value={formData.emailConfirm}
                                onChange={handleChange}
                                placeholder="E-postayı tekrar girin"
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${errors.emailConfirm ? '#ef4444' : 'var(--border)'}`,
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    if (!errors.emailConfirm) {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = errors.emailConfirm ? '#ef4444' : 'var(--border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            {errors.emailConfirm && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>⚠️ {errors.emailConfirm}</span>}
                        </div>
                    </div>

                    {/* University & Department */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                🎓 Üniversite *
                            </label>
                            <select
                                name="university"
                                value={formData.university}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${errors.university ? '#ef4444' : 'var(--border)'}`,
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                onFocus={(e) => {
                                    if (!errors.university) {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = errors.university ? '#ef4444' : 'var(--border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>
                                <option value="">Üniversite seçin</option>
                                {universities.map(uni => (
                                    <option key={uni} value={uni}>{uni}</option>
                                ))}
                            </select>
                            {errors.university && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>⚠️ {errors.university}</span>}
                        </div>

                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                📚 Bölüm *
                            </label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    borderRadius: '12px',
                                    border: `2px solid ${errors.department ? '#ef4444' : 'var(--border)'}`,
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                onFocus={(e) => {
                                    if (!errors.department) {
                                        e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                    }
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = errors.department ? '#ef4444' : 'var(--border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}>
                                <option value="">Bölüm seçin</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                            {errors.department && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>⚠️ {errors.department}</span>}
                        </div>
                    </div>

                    {/* Password Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                🔑 Şifre *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.9rem 3rem 0.9rem 0.9rem',
                                        borderRadius: '12px',
                                        border: `2px solid ${errors.password ? '#ef4444' : 'var(--border)'}`,
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={(e) => {
                                        if (!errors.password) {
                                            e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = errors.password ? '#ef4444' : 'var(--border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        fontSize: '1.2rem'
                                    }}>
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {errors.password && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>⚠️ {errors.password}</span>}
                        </div>

                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--text)',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                ✅ Şifre Tekrar *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPasswordConfirm ? "text" : "password"}
                                    name="passwordConfirm"
                                    value={formData.passwordConfirm}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.9rem 3rem 0.9rem 0.9rem',
                                        borderRadius: '12px',
                                        border: `2px solid ${errors.passwordConfirm ? '#ef4444' : 'var(--border)'}`,
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={(e) => {
                                        if (!errors.passwordConfirm) {
                                            e.currentTarget.style.borderColor = 'var(--accent-purple)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = errors.passwordConfirm ? '#ef4444' : 'var(--border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                    style={{
                                        position: 'absolute',
                                        right: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        fontSize: '1.2rem'
                                    }}>
                                    {showPasswordConfirm ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {errors.passwordConfirm && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>⚠️ {errors.passwordConfirm}</span>}
                        </div>
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            ⚠️ {errors.submit}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button type="submit" disabled={isSubmitting} style={{
                        padding: '1.1rem',
                        background: isSubmitting ? 'var(--text-secondary)' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '1.05rem',
                        marginTop: '0.5rem',
                        transition: 'all 0.3s ease',
                        boxShadow: isSubmitting ? 'none' : '0 8px 20px rgba(139, 92, 246, 0.4)'
                    }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 28px rgba(139, 92, 246, 0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
                        }}>
                        {isSubmitting ? '⏳ Kaydediliyor...' : '✨ Hesap Oluştur'}
                    </button>

                    {/* Login Link */}
                    <div style={{
                        textAlign: 'center',
                        marginTop: '0.5rem',
                        padding: '1rem',
                        backgroundColor: 'var(--background)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)'
                    }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Zaten hesabın var mı?{' '}
                        </span>
                        <Link href="/login" style={{
                            color: 'var(--accent-purple)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'opacity 0.2s ease'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                            Giriş Yap →
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
