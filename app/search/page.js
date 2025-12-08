'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// Highlight matching text
function HighlightText({ text, query }) {
    if (!query || !text) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} style={{
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(249, 115, 22, 0.3))',
                        color: 'inherit',
                        padding: '0 2px',
                        borderRadius: '3px'
                    }}>{part}</mark>
                ) : part
            )}
        </>
    );
}

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const inputRef = useRef(null);

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('relevance');
    const [history, setHistory] = useState([]);
    const [suggestions, setSuggestions] = useState({ trending: [], trendingPosts: [] });
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [autocompleteResults, setAutocompleteResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isMobile, setIsMobile] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [announcements, setAnnouncements] = useState([]);

    // Debounced query for autocomplete
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 767);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchHistory();
        fetchSuggestions();
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch('/api/announcements');
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        }
    };

    useEffect(() => {
        const q = searchParams.get('q');
        if (q) {
            setQuery(q);
            performSearch(q);
        }
    }, [searchParams]);

    // Debounced autocomplete fetch
    useEffect(() => {
        if (debouncedQuery.trim().length > 1) {
            setIsSearching(true);
            fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
                .then(res => res.json())
                .then(data => {
                    const historyMatches = history.filter(h =>
                        h.toLowerCase().includes(debouncedQuery.toLowerCase())
                    ).slice(0, 3);
                    const apiSuggestions = data.suggestions || [];
                    const combined = [...new Set([...historyMatches, ...apiSuggestions])].slice(0, 8);
                    setAutocompleteResults(combined);
                    setSelectedIndex(-1);
                })
                .catch(err => console.error(err))
                .finally(() => setIsSearching(false));
        } else {
            setAutocompleteResults([]);
        }
    }, [debouncedQuery, history]);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/search/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const fetchSuggestions = async () => {
        try {
            const res = await fetch('/api/search/suggestions');
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data);
            }
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        }
    };

    const performSearch = async (searchQuery = query, filterType = filter, sortType = sort) => {
        if (!searchQuery.trim()) {
            setResults(null);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${filterType}&sort=${sortType}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
                fetchHistory();
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
            setShowAutocomplete(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    const handleQueryChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setShowAutocomplete(val.trim().length > 0);
        setSelectedIndex(-1);
    };

    // Keyboard navigation for autocomplete
    const handleKeyDown = useCallback((e) => {
        if (!showAutocomplete || autocompleteResults.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (query.trim()) {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                }
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < autocompleteResults.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : autocompleteResults.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && autocompleteResults[selectedIndex]) {
                    const selected = autocompleteResults[selectedIndex];
                    setQuery(selected);
                    setShowAutocomplete(false);
                    router.push(`/search?q=${encodeURIComponent(selected)}`);
                } else if (query.trim()) {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                }
                break;
            case 'Escape':
                setShowAutocomplete(false);
                setSelectedIndex(-1);
                break;
        }
    }, [showAutocomplete, autocompleteResults, selectedIndex, query, router]);

    const selectSuggestion = (item) => {
        setQuery(item);
        setShowAutocomplete(false);
        router.push(`/search?q=${encodeURIComponent(item)}`);
    };

    const clearHistory = async () => {
        try {
            await fetch('/api/search/history', { method: 'DELETE' });
            setHistory([]);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    const getTotalResults = () => {
        if (!results) return 0;
        return (results.posts?.length || 0) +
            (results.users?.length || 0) +
            (results.notes?.length || 0) +
            (results.courses?.length || 0) +
            (results.announcements?.length || 0);
    };

    // Styles
    const containerStyle = {
        minHeight: '100vh',
        background: 'var(--background)',
        padding: isMobile ? '1rem' : '2rem'
    };

    const contentStyle = {
        maxWidth: '900px',
        margin: '0 auto'
    };

    const headerStyle = {
        marginBottom: '2rem',
        textAlign: 'center'
    };

    const titleStyle = {
        fontSize: isMobile ? '2rem' : '2.5rem',
        fontWeight: '800',
        marginBottom: '0.5rem',
        background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ec4899 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    };

    const subtitleStyle = {
        color: 'var(--text-secondary)',
        fontSize: '1rem'
    };

    const searchBoxStyle = {
        position: 'relative',
        marginBottom: '2rem'
    };

    const inputStyle = {
        width: '100%',
        padding: '1.25rem 1.5rem',
        paddingLeft: '3.5rem',
        paddingRight: isSearching ? '3.5rem' : '1.5rem',
        fontSize: '1.1rem',
        border: '2px solid var(--border)',
        borderRadius: '16px',
        backgroundColor: 'var(--secondary)',
        color: 'var(--text)',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    };

    const searchIconStyle = {
        position: 'absolute',
        left: '1.25rem',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '1.25rem',
        color: 'var(--text-secondary)',
        pointerEvents: 'none'
    };

    const loadingSpinnerStyle = {
        position: 'absolute',
        right: '1.25rem',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '20px',
        height: '20px',
        border: '2px solid var(--border)',
        borderTopColor: '#f97316',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    };

    const autocompleteStyle = {
        position: 'absolute',
        top: 'calc(100% + 0.5rem)',
        left: 0,
        right: 0,
        backgroundColor: 'var(--secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        zIndex: 100,
        maxHeight: '350px',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)'
    };

    const autocompleteItemStyle = (isSelected) => ({
        padding: '1rem 1.25rem',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'all 0.2s',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        backgroundColor: isSelected ? 'var(--background)' : 'transparent'
    });

    const filterContainerStyle = {
        display: 'flex',
        gap: isMobile ? '0.5rem' : '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: 'var(--secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border)'
    };

    const filterButtonStyle = (isActive) => ({
        padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1.2rem',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: isActive ? 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' : 'var(--background)',
        background: isActive ? 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' : 'var(--background)',
        color: isActive ? 'white' : 'var(--text)',
        cursor: 'pointer',
        fontSize: isMobile ? '0.8rem' : '0.9rem',
        fontWeight: isActive ? '600' : '500',
        transition: 'all 0.2s',
        boxShadow: isActive ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none'
    });

    const cardStyle = {
        padding: '1.5rem',
        backgroundColor: 'var(--secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    };

    const sectionTitleStyle = {
        fontSize: '1.25rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    };

    const tagStyle = (isPrimary) => ({
        padding: '0.5rem 1rem',
        backgroundColor: isPrimary ? 'transparent' : 'var(--secondary)',
        background: isPrimary ? 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' : 'var(--secondary)',
        border: isPrimary ? 'none' : '1px solid var(--border)',
        borderRadius: '25px',
        color: isPrimary ? 'white' : 'var(--text)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: isPrimary ? '600' : '400',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem'
    });

    return (
        <div style={containerStyle}>
            {/* Background Gradient */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '400px',
                background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.05) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <style jsx>{`
                @keyframes spin {
                    to { transform: translateY(-50%) rotate(360deg); }
                }
            `}</style>

            <div style={{ ...contentStyle, position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={headerStyle}>
                    <h1 style={titleStyle}>Ara</h1>
                    <p style={subtitleStyle}>Topluluk, kullanıcı, not veya ders ara</p>
                </div>

                {/* Search Box */}
                <form onSubmit={handleSearch} style={searchBoxStyle}>
                    <span style={searchIconStyle}>🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleQueryChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ne aramak istiyorsun?"
                        style={inputStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#f97316';
                            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.1)';
                            if (query.trim()) setShowAutocomplete(true);
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
                            setTimeout(() => setShowAutocomplete(false), 200);
                        }}
                        autoComplete="off"
                    />
                    {isSearching && <div style={loadingSpinnerStyle} />}

                    {/* Autocomplete with keyboard navigation */}
                    {showAutocomplete && query.trim() && (autocompleteResults.length > 0 || history.length > 0) && (
                        <div style={autocompleteStyle}>
                            {autocompleteResults.length > 0 ? (
                                autocompleteResults.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => selectSuggestion(item)}
                                        style={autocompleteItemStyle(idx === selectedIndex)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                    >
                                        <span style={{ fontSize: '1rem', opacity: 0.6 }}>
                                            {history.includes(item) ? '🕒' : '🔍'}
                                        </span>
                                        <span style={{ fontWeight: '500' }}>
                                            <HighlightText text={item} query={query} />
                                        </span>
                                    </div>
                                ))
                            ) : (
                                history.filter(h => h.toLowerCase().includes(query.toLowerCase())).slice(0, 5).map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => selectSuggestion(item)}
                                        style={autocompleteItemStyle(idx === selectedIndex)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                    >
                                        <span style={{ fontSize: '1rem', opacity: 0.6 }}>🕒</span>
                                        <span style={{ fontWeight: '500' }}>
                                            <HighlightText text={item} query={query} />
                                        </span>
                                    </div>
                                ))
                            )}
                            {/* Keyboard hint */}
                            <div style={{
                                padding: '0.75rem 1.25rem',
                                borderTop: '1px solid var(--border)',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                gap: '1rem'
                            }}>
                                <span>↑↓ gezin</span>
                                <span>Enter seç</span>
                                <span>Esc kapat</span>
                            </div>
                        </div>
                    )}
                </form>

                {/* Filters */}
                {results && (
                    <div style={filterContainerStyle}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                            {[
                                { v: 'all', l: '📋 Tümü' },
                                { v: 'posts', l: '💬 Gönderiler' },
                                { v: 'users', l: '👥 Kullanıcılar' },
                                { v: 'notes', l: '📝 Notlar' },
                                { v: 'courses', l: '📚 Dersler' },
                                { v: 'announcements', l: '📢 Duyurular' }
                            ].map(f => (
                                <button
                                    key={f.v}
                                    onClick={() => {
                                        setFilter(f.v);
                                        performSearch(query, f.v, sort);
                                    }}
                                    style={filterButtonStyle(filter === f.v)}
                                >
                                    {f.l}
                                </button>
                            ))}
                        </div>

                        <select
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value);
                                performSearch(query, filter, e.target.value);
                            }}
                            style={{
                                padding: '0.6rem 1rem',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--background)',
                                color: 'var(--text)',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <option value="relevance">Uygunluk</option>
                            <option value="date">Tarih</option>
                            <option value="popularity">Popülerlik</option>
                        </select>

                        <div style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'rgba(249, 115, 22, 0.1)',
                            borderRadius: '8px',
                            color: '#f97316',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>
                            {getTotalResults()} sonuç
                        </div>
                    </div>
                )}

                {/* Results */}
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '3px solid var(--border)',
                            borderTopColor: '#f97316',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1rem'
                        }} />
                        Aranıyor...
                    </div>
                ) : results ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Posts */}
                        {results.posts && results.posts.length > 0 && (
                            <section>
                                <h2 style={sectionTitleStyle}>💬 Gönderiler</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {results.posts.map(post => (
                                        <Link key={post.id} href={`/topluluk/${post.id}`} style={{
                                            ...cardStyle,
                                            textDecoration: 'none'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#f97316';
                                                e.currentTarget.style.transform = 'translateY(-3px)';
                                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(249, 115, 22, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}>
                                            <h3 style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                <HighlightText text={post.title} query={query} />
                                            </h3>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                                                <HighlightText text={post.content.substring(0, 150) + '...'} query={query} />
                                            </p>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                <span style={{ fontWeight: '500' }}>{post.author.name}</span>
                                                <span>💬 {post._count.replies}</span>
                                                <span>👁️ {post.viewCount}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Announcements Results */}
                        {results.announcements && results.announcements.length > 0 && (
                            <section>
                                <h2 style={sectionTitleStyle}>📢 Duyurular</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {results.announcements.map(announcement => (
                                        <div key={announcement.id} style={{
                                            ...cardStyle,
                                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(249, 115, 22, 0.05))',
                                            borderColor: 'rgba(249, 115, 22, 0.2)'
                                        }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text)' }}>
                                                <HighlightText text={announcement.title} query={query} />
                                            </h3>
                                            <p style={{ color: 'var(--text)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                                <HighlightText text={announcement.content} query={query} />
                                            </p>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                                                {new Date(announcement.createdAt).toLocaleDateString('tr-TR')} - {announcement.author.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Users */}
                        {results.users && results.users.length > 0 && (
                            <section>
                                <h2 style={sectionTitleStyle}>👥 Kullanıcılar</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                    {results.users.map(user => (
                                        <Link key={user.id} href={`/profile/${user.username}`} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            ...cardStyle,
                                            textDecoration: 'none'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#f97316';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}>
                                            <div style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                color: 'white',
                                                overflow: 'hidden',
                                                flexShrink: 0
                                            }}>
                                                {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '1rem' }}>
                                                    <HighlightText text={user.name} query={query} />
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#f97316' }}>@{user.username}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Notes */}
                        {results.notes && results.notes.length > 0 && (
                            <section>
                                <h2 style={sectionTitleStyle}>📝 Notlar</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {results.notes.map(note => (
                                        <Link key={note.id} href={`/arsiv/${note.id}`} style={{
                                            ...cardStyle,
                                            textDecoration: 'none'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#f97316';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}>
                                            <h3 style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                <HighlightText text={note.title} query={query} />
                                            </h3>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {note.author?.name}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Courses */}
                        {results.courses && results.courses.length > 0 && (
                            <section>
                                <h2 style={sectionTitleStyle}>📚 Dersler</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                    {results.courses.map(course => (
                                        <div key={course.id} style={cardStyle}>
                                            <h3 style={{ fontSize: '1rem', color: 'var(--text)', marginBottom: '0.25rem', fontWeight: '600' }}>
                                                <HighlightText text={course.name} query={query} />
                                            </h3>
                                            <div style={{ fontSize: '0.85rem', color: '#f97316' }}>
                                                {course.code}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {getTotalResults() === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '4rem 2rem',
                                color: 'var(--text-secondary)'
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Sonuç bulunamadı</div>
                                <div>Farklı anahtar kelimeler deneyin</div>
                            </div>
                        )}
                    </div>
                ) : !query.trim() ? (
                    /* Default State */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* History */}
                        {history.length > 0 && (
                            <div style={cardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>🕒 Son Aramalar</h2>
                                    <button onClick={clearHistory} style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#f97316',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}>
                                        Temizle
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {history.map((item, idx) => (
                                        <button key={idx} onClick={() => router.push(`/search?q=${encodeURIComponent(item)}`)} style={tagStyle(false)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#f97316';
                                                e.currentTarget.style.color = '#f97316';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                                e.currentTarget.style.color = 'var(--text)';
                                            }}>
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trending */}
                        {suggestions.trending && suggestions.trending.length > 0 && (
                            <div style={cardStyle}>
                                <h2 style={sectionTitleStyle}>🔥 Popüler Aramalar</h2>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {suggestions.trending.map((item, idx) => (
                                        <button key={idx} onClick={() => router.push(`/search?q=${encodeURIComponent(item)}`)} style={tagStyle(true)}>
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Grid Container for Trending Posts & Announcements */}
                        {(suggestions.trendingPosts?.length > 0 || announcements.length > 0) && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                gap: '2rem',
                                alignItems: 'start'
                            }}>
                                {/* Trending Posts */}
                                <div>
                                    {suggestions.trendingPosts && suggestions.trendingPosts.length > 0 && (
                                        <div style={{
                                            ...cardStyle,
                                            height: '100%'
                                        }}>
                                            <h2 style={sectionTitleStyle}>📈 Trend Gönderiler</h2>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                {suggestions.trendingPosts.map((post, idx) => (
                                                    <Link key={idx} href={`/forum/${post.id}`} style={{
                                                        textDecoration: 'none',
                                                        display: 'block',
                                                        borderBottom: idx < suggestions.trendingPosts.length - 1 ? '1px solid var(--border)' : 'none',
                                                        paddingBottom: idx < suggestions.trendingPosts.length - 1 ? '1.25rem' : 0,
                                                        transition: 'transform 0.2s'
                                                    }}
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                                    >
                                                        <div style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                            {post.title}
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <span>👁️ {post.views} görüntülenme</span>
                                                            <span style={{ color: '#f97316' }}>Devamını Oku →</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Announcements */}
                                <div>
                                    {announcements.length > 0 && (
                                        <div style={{
                                            ...cardStyle,
                                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(249, 115, 22, 0.05))',
                                            borderColor: 'rgba(249, 115, 22, 0.2)',
                                            height: '100%'
                                        }}>
                                            <h2 style={sectionTitleStyle}>📢 Duyurular</h2>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                {announcements.map((announcement, idx) => (
                                                    <div key={announcement.id} style={{
                                                        borderBottom: idx < announcements.length - 1 ? '1px solid var(--border)' : 'none',
                                                        paddingBottom: idx < announcements.length - 1 ? '1.25rem' : 0
                                                    }}>
                                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text)' }}>
                                                            {announcement.title}
                                                        </h3>
                                                        <p style={{ color: 'var(--text)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                                            {announcement.content}
                                                        </p>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                                            {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--background)',
                color: 'var(--text-secondary)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '3px solid var(--border)',
                        borderTopColor: '#f97316',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }} />
                    Yükleniyor...
                </div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
