'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function FeaturesSection() {
    const { status } = useSession();
    const [forumPosts, setForumPosts] = useState([]);
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredPost, setHoveredPost] = useState(null);
    const [hoveredExam, setHoveredExam] = useState(null);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchDynamicContent();
        } else {
            setLoading(false);
        }
    }, [status]);

    const fetchDynamicContent = async () => {
        try {
            const forumRes = await fetch('/api/forum/posts');
            if (forumRes.ok) {
                const forumData = await forumRes.json();
                const posts = forumData.posts || [];
                const filtered = posts
                    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                    .slice(0, 5);
                setForumPosts(filtered);
            }

            const coursesRes = await fetch('/api/courses');
            const courseExams = [];
            if (coursesRes.ok) {
                const coursesData = await coursesRes.json();
                coursesData
                    .filter(course => course.examDate && new Date(course.examDate) > new Date())
                    .forEach(course => {
                        courseExams.push({
                            code: course.code,
                            examDate: course.examDate
                        });
                    });
            }

            const tasksRes = await fetch('/api/tasks');
            if (tasksRes.ok) {
                const tasksData = await tasksRes.json();
                tasksData
                    .filter(task => task.category === 'EXAM' && task.dueDate && new Date(task.dueDate) > new Date())
                    .forEach(task => {
                        courseExams.push({
                            code: task.title,
                            examDate: task.dueDate
                        });
                    });
            }

            const sortedExams = courseExams
                .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
                .slice(0, 4);
            setUpcomingExams(sortedExams);
        } catch (error) {
            console.error('Error fetching dynamic content:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatExamDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const day = date.getDate();
        const month = date.toLocaleDateString('tr-TR', { month: 'short' });

        return { day, month, diffDays };
    };

    if (status !== 'authenticated') {
        return null;
    }

    return (
        <section className="dashboard-section">
            <div className="section-header">
                <h2 className="section-title">
                    <span className="title-icon">📊</span>
                    Senin İçin
                </h2>
                <p className="section-subtitle">Güncel içerikler ve yaklaşan etkinlikler</p>
            </div>

            <div className="cards-grid">
                {/* Trend Sorular */}
                {!loading && forumPosts.length > 0 && (
                    <div className="dashboard-card trending-card">
                        <div className="card-accent trending-accent"></div>

                        <div className="card-top">
                            <div className="card-badge">
                                <span className="badge-icon">🔥</span>
                                <span className="badge-text">Popüler</span>
                            </div>
                            <Link href="/topluluk" className="see-all">
                                Tümü
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>

                        <h3 className="card-title">Trend Sorular</h3>

                        <div className="posts-list">
                            {forumPosts.slice(0, 4).map((post, idx) => (
                                <Link
                                    key={post.id}
                                    href={`/topluluk/${post.id}`}
                                    className={`post-row ${hoveredPost === idx ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHoveredPost(idx)}
                                    onMouseLeave={() => setHoveredPost(null)}
                                >
                                    <div className="post-number">{idx + 1}</div>
                                    <div className="post-content">
                                        <span className="post-title">{post.title}</span>
                                        <div className="post-stats">
                                            <span className="stat">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                {post.viewCount || 0}
                                            </span>
                                            <span className="stat-divider">·</span>
                                            <span className="stat">{post.author?.username || 'Anonim'}</span>
                                        </div>
                                    </div>
                                    <div className="post-arrow">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <Link href="/topluluk" className="card-action trending-action">
                            <span>Soru Sor</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </Link>
                    </div>
                )}

                {/* Yaklaşan Sınavlar */}
                {!loading && upcomingExams.length > 0 && (
                    <div className="dashboard-card exams-card">
                        <div className="card-accent exams-accent"></div>

                        <div className="card-top">
                            <div className="card-badge exams-badge">
                                <span className="badge-icon">📅</span>
                                <span className="badge-text">Takvim</span>
                            </div>
                        </div>

                        <h3 className="card-title">Yaklaşan Sınavlar</h3>

                        <div className="exams-list">
                            {upcomingExams.map((exam, idx) => {
                                const { day, month, diffDays } = formatExamDate(exam.examDate);
                                const isUrgent = diffDays <= 3;
                                const isToday = diffDays === 0;
                                const isTomorrow = diffDays === 1;

                                return (
                                    <div
                                        key={idx}
                                        className={`exam-row ${isUrgent ? 'urgent' : ''} ${hoveredExam === idx ? 'hovered' : ''}`}
                                        onMouseEnter={() => setHoveredExam(idx)}
                                        onMouseLeave={() => setHoveredExam(null)}
                                    >
                                        <div className={`exam-calendar ${isUrgent ? 'urgent-cal' : ''}`}>
                                            <span className="cal-day">{day}</span>
                                            <span className="cal-month">{month}</span>
                                        </div>
                                        <div className="exam-details">
                                            <span className="exam-name">{exam.code}</span>
                                            <span className={`exam-countdown ${isUrgent ? 'urgent-count' : ''}`}>
                                                {isToday ? '⚡ Bugün' : isTomorrow ? '⏰ Yarın' : `${diffDays} gün`}
                                            </span>
                                        </div>
                                        {isUrgent && (
                                            <div className="urgent-indicator">
                                                <span className="pulse"></span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <Link href="/courses" className="card-action exams-action">
                            <span>Tüm Dersleri Gör</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>

            <style jsx>{`
                .dashboard-section {
                    padding: 3rem 5%;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .section-header {
                    margin-bottom: 2.5rem;
                }

                .section-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: var(--text);
                    margin: 0 0 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .title-icon {
                    font-size: 1.5rem;
                }

                .section-subtitle {
                    color: var(--text-secondary);
                    font-size: 1rem;
                    margin: 0;
                }

                .cards-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }

                .dashboard-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 20px;
                    padding: 1.75rem;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .dashboard-card:hover {
                    border-color: rgba(255, 255, 255, 0.12);
                    transform: translateY(-2px);
                }

                .card-accent {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                }

                .trending-accent {
                    background: linear-gradient(90deg, #f97316, #fb923c);
                }

                .exams-accent {
                    background: linear-gradient(90deg, #8b5cf6, #a78bfa);
                }

                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .card-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.35rem 0.75rem;
                    background: rgba(249, 115, 22, 0.1);
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #f97316;
                }

                .exams-badge {
                    background: rgba(139, 92, 246, 0.1);
                    color: #a78bfa;
                }

                .badge-icon {
                    font-size: 0.85rem;
                }

                .see-all {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .see-all:hover {
                    color: #f97316;
                }

                .card-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text);
                    margin: 0 0 1.25rem;
                }

                /* Posts List */
                .posts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                }

                .post-row {
                    display: flex;
                    align-items: center;
                    gap: 0.875rem;
                    padding: 0.875rem 1rem;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid transparent;
                    border-radius: 12px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                .post-row:hover, .post-row.hovered {
                    background: rgba(249, 115, 22, 0.05);
                    border-color: rgba(249, 115, 22, 0.15);
                }

                .post-number {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(249, 115, 22, 0.15);
                    color: #f97316;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    flex-shrink: 0;
                }

                .post-content {
                    flex: 1;
                    min-width: 0;
                }

                .post-title {
                    display: block;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-bottom: 0.25rem;
                }

                .post-stats {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .stat {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .stat-divider {
                    opacity: 0.4;
                }

                .post-arrow {
                    color: var(--text-secondary);
                    opacity: 0;
                    transform: translateX(-5px);
                    transition: all 0.2s;
                }

                .post-row:hover .post-arrow {
                    opacity: 1;
                    transform: translateX(0);
                }

                /* Exams List */
                .exams-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.625rem;
                    margin-bottom: 1.5rem;
                }

                .exam-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.875rem 1rem;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid transparent;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }

                .exam-row:hover, .exam-row.hovered {
                    background: rgba(139, 92, 246, 0.05);
                    border-color: rgba(139, 92, 246, 0.15);
                }

                .exam-row.urgent {
                    border-color: rgba(239, 68, 68, 0.2);
                    background: rgba(239, 68, 68, 0.03);
                }

                .exam-calendar {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(167, 139, 250, 0.1));
                    border: 1px solid rgba(139, 92, 246, 0.2);
                    border-radius: 10px;
                    flex-shrink: 0;
                }

                .exam-calendar.urgent-cal {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.1));
                    border-color: rgba(239, 68, 68, 0.3);
                }

                .cal-day {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: var(--text);
                    line-height: 1;
                }

                .cal-month {
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    margin-top: 2px;
                }

                .exam-details {
                    flex: 1;
                    min-width: 0;
                }

                .exam-name {
                    display: block;
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: var(--text);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-bottom: 0.2rem;
                }

                .exam-countdown {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    font-weight: 600;
                }

                .exam-countdown.urgent-count {
                    color: #ef4444;
                }

                .urgent-indicator {
                    width: 10px;
                    height: 10px;
                    position: relative;
                }

                .pulse {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: #ef4444;
                    border-radius: 50%;
                    animation: pulse-anim 1.5s infinite;
                }

                @keyframes pulse-anim {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }

                /* Card Actions */
                .card-action {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.875rem;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.25s ease;
                }

                .trending-action {
                    background: rgba(249, 115, 22, 0.1);
                    color: #f97316;
                    border: 1px solid rgba(249, 115, 22, 0.2);
                }

                .trending-action:hover {
                    background: #f97316;
                    color: white;
                    border-color: #f97316;
                }

                .exams-action {
                    background: rgba(139, 92, 246, 0.1);
                    color: #a78bfa;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                }

                .exams-action:hover {
                    background: #8b5cf6;
                    color: white;
                    border-color: #8b5cf6;
                }

                @media (max-width: 900px) {
                    .cards-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 600px) {
                    .dashboard-section {
                        padding: 2rem 1rem;
                    }

                    .section-title {
                        font-size: 1.4rem;
                    }

                    .dashboard-card {
                        padding: 1.25rem;
                    }

                    .post-row, .exam-row {
                        padding: 0.75rem;
                    }

                    .exam-calendar {
                        width: 42px;
                        height: 42px;
                    }

                    .cal-day {
                        font-size: 1rem;
                    }
                }
            `}</style>
        </section>
    );
}
