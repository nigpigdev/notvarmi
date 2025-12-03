'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('relevance');
    const [history, setHistory] = useState([]);
    const [suggestions, setSuggestions] = useState({ trending: [], trendingPosts: [] });
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [autocompleteResults, setAutocompleteResults] = useState([]);

    const [announcements, setAnnouncements] = useState([]);

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

        if (val.trim().length > 1) {
            // Debounce could be added here, but for now direct call
            fetch(`/api/search/suggestions?q=${encodeURIComponent(val)}`)
                .then(res => res.json())
                .then(data => {
                    // Combine history matches and API suggestions
                    const historyMatches = history.filter(h => h.toLowerCase().includes(val.toLowerCase()));
                    const apiSuggestions = data.suggestions || [];
                    // Merge unique
                    const combined = [...new Set([...historyMatches, ...apiSuggestions])];
                    setAutocompleteResults(combined);
                })
                .catch(err => console.error(err));
        } else {
            setAutocompleteResults([]);
        }
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

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
            {/* Search Bar */}
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text)', fontWeight: '600' }}>
                    🔍 Ara
                </h1>

                <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        value={query}
                        onChange={handleQueryChange}
                        placeholder="Forum, kullanıcı, not veya ders ara..."
                        style={{
                            width: '100%',
                            padding: '1rem 1.5rem',
                            fontSize: '1rem',
                            border: '2px solid var(--border)',
                            borderRadius: '12px',
                            backgroundColor: 'var(--secondary)',
                            color: 'var(--text)',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            setTimeout(() => setShowAutocomplete(false), 200);
                        }}
                    />

                    {/* Autocomplete */}
                    {showAutocomplete && query.trim() && (autocompleteResults.length > 0 || history.length > 0) && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.5rem)',
                            left: 0,
                            right: 0,
                            backgroundColor: 'var(--secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {autocompleteResults.length > 0 ? (
                                autocompleteResults.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setQuery(item);
                                            setShowAutocomplete(false);
                                            performSearch(item);
                                        }}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--border)',
                                            transition: 'background 0.2s',
                                            color: 'var(--text)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <span style={{ fontSize: '0.9rem' }}>🔍</span>
                                        {item}
                                    </div>
                                ))
                            ) : (
                                history.filter(h => h.toLowerCase().includes(query.toLowerCase())).slice(0, 5).map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setQuery(item);
                                            setShowAutocomplete(false);
                                            performSearch(item);
                                        }}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--border)',
                                            transition: 'background 0.2s',
                                            color: 'var(--text)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <span style={{ fontSize: '0.9rem' }}>🕒</span>
                                        {item}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </form>

                {/* Filters */}
                {results && (
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[
                                { v: 'all', l: 'Tümü' },
                                { v: 'posts', l: 'Gönderiler' },
                                { v: 'users', l: 'Kullanıcılar' },
                                { v: 'notes', l: 'Notlar' },
                                { v: 'courses', l: 'Dersler' },
                                { v: 'announcements', l: 'Duyurular' }
                            ].map(f => (
                                <button
                                    key={f.v}
                                    onClick={() => {
                                        setFilter(f.v);
                                        performSearch(query, f.v, sort);
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: filter === f.v ? '2px solid var(--primary)' : '1px solid var(--border)',
                                        backgroundColor: filter === f.v ? 'var(--primary-light)' : 'var(--secondary)',
                                        color: filter === f.v ? 'var(--primary)' : 'var(--text)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: filter === f.v ? '600' : '400',
                                        transition: 'all 0.2s'
                                    }}
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
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--secondary)',
                                color: 'var(--text)',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <option value="relevance">Uygunluk</option>
                            <option value="date">Tarih</option>
                            <option value="popularity">Popülerlik</option>
                        </select>

                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginLeft: 'auto' }}>
                            {getTotalResults()} sonuç
                        </span>
                    </div>
                )}
            </div>

            {/* Results */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Aranıyor...
                </div>
            ) : results ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Posts */}
                    {results.posts && results.posts.length > 0 && (
                        <section>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text)' }}>Gönderiler</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {results.posts.map(post => (
                                    <Link key={post.id} href={`/forum/${post.id}`} style={{
                                        display: 'block',
                                        padding: '1.5rem',
                                        backgroundColor: 'var(--secondary)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}>
                                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.5rem' }}>{post.title}</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                            {post.content.substring(0, 150)}...
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <span>{post.author.name}</span>
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
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text)' }}>📢 Duyurular</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {results.announcements.map(announcement => (
                                    <div key={announcement.id} style={{
                                        padding: '1.5rem',
                                        backgroundColor: 'var(--secondary)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text)' }}>
                                            {announcement.title}
                                        </h3>
                                        <p style={{ color: 'var(--text)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                            {announcement.content}
                                        </p>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
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
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text)' }}>Kullanıcılar</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {results.users.map(user => (
                                    <Link key={user.id} href={`/profile/${user.username}`} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        backgroundColor: 'var(--secondary)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        textDecoration: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            color: 'white',
                                            overflow: 'hidden'
                                        }}>
                                            {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name[0]}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--text)' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>@{user.username}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {getTotalResults() === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            Sonuç bulunamadı
                        </div>
                    )}
                </div>
            ) : !query.trim() ? (
                /* Default State */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* History */}
                    {history.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.3rem', color: 'var(--text)' }}>Son Aramalar</h2>
                                <button onClick={clearHistory} style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    textDecoration: 'underline'
                                }}>
                                    Temizle
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {history.map((item, idx) => (
                                    <button key={idx} onClick={() => router.push(`/search?q=${encodeURIComponent(item)}`)} style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: 'var(--secondary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '20px',
                                        color: 'var(--text)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--primary)';
                                            e.currentTarget.style.color = 'white';
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--secondary)';
                                            e.currentTarget.style.color = 'var(--text)';
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                        }}>
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trending */}
                    {suggestions.trending && suggestions.trending.length > 0 && (
                        <div>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text)' }}>Popüler Aramalar</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {suggestions.trending.map((item, idx) => (
                                    <button key={idx} onClick={() => router.push(`/search?q=${encodeURIComponent(item)}`)} style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: 'var(--primary)',
                                        border: 'none',
                                        borderRadius: '20px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        transition: 'opacity 0.2s'
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                                        🔥 {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trending Posts */}
                    {suggestions.trendingPosts && suggestions.trendingPosts.length > 0 && (
                        <div>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text)' }}>Trend Gönderiler</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {suggestions.trendingPosts.map((post, idx) => (
                                    <div key={idx} style={{
                                        padding: '1rem',
                                        backgroundColor: 'var(--secondary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <div style={{ fontSize: '1rem', color: 'var(--text)', marginBottom: '0.25rem', fontWeight: '500' }}>
                                            {post.title}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            👁️ {post.views} görüntülenme
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Announcements */}
                    {announcements.length > 0 && (
                        <div style={{
                            padding: '1.5rem',
                            backgroundColor: 'var(--secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border)'
                        }}>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--text)' }}>📢 Duyurular</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {announcements.map(announcement => (
                                    <div key={announcement.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', lastChild: { borderBottom: 'none' } }}>
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
            ) : null}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Yükleniyor...
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
