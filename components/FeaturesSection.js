'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function FeaturesSection() {
    const { status } = useSession();
    const [forumPosts, setForumPosts] = useState([]);
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rotationIndex, setRotationIndex] = useState(0);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchDynamicContent();
        } else {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated' && forumPosts.length > 3) {
            const interval = setInterval(() => {
                setRotationIndex(prev => prev + 1);
            }, 8000);
            return () => clearInterval(interval);
        }
    }, [status, forumPosts.length]);

    const fetchDynamicContent = async () => {
        try {
            const forumRes = await fetch('/api/forum/posts');
            if (forumRes.ok) {
                const forumData = await forumRes.json();
                const posts = forumData.posts || [];
                const filtered = posts
                    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                    .slice(0, 6);
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

    const getRotatedItems = (items, count = 3) => {
        if (items.length === 0) return [];
        const startIndex = rotationIndex % Math.max(1, items.length - count + 1);
        return items.slice(startIndex, startIndex + count);
    };

    const formatExamDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' });
        const formattedDate = date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });

        return { dayName, formattedDate, diffDays };
    };

    // Hide the entire section if not logged in
    if (status !== 'authenticated') {
        return null;
    }

    return (
        <div className="features-wrapper">

            {/* Sınavlar Card - Only show if there are upcoming exams */}
            {!loading && upcomingExams.length > 0 && (
                <div className="feature-card exams-theme">
                    <div className="card-header">
                        <div className="header-left">
                            <span className="card-icon exams-icon">📅</span>
                            <div>
                                <h2>Yaklaşan Sınavlar</h2>
                                <p>Hazırlıklı ol, başarılı ol</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        <div className="content-list">
                            {upcomingExams.map((exam, idx) => {
                                const { dayName, formattedDate, diffDays } = formatExamDate(exam.examDate);
                                const isUrgent = diffDays <= 3;

                                return (
                                    <div key={idx} className={`exam-item ${isUrgent ? 'urgent' : ''}`}>
                                        <div className="exam-date">
                                            <span className="date-day">{dayName}</span>
                                            <span className="date-num">{formattedDate}</span>
                                        </div>
                                        <div className="exam-info">
                                            <h4>{exam.code}</h4>
                                            <span className={`countdown ${isUrgent ? 'urgent-text' : ''}`}>
                                                {diffDays === 0 ? '⚡ Bugün!' :
                                                    diffDays === 1 ? '⚠️ Yarın' :
                                                        `${diffDays} gün kaldı`}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .features-wrapper {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    padding-bottom: 3rem;
                }

                .feature-card {
                    background: var(--secondary);
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s ease;
                }

                .feature-card:hover {
                    border-color: rgba(249, 115, 22, 0.3);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                }

                .exams-theme:hover {
                    border-color: rgba(236, 72, 153, 0.3);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.25rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .card-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #f97316, #fbbf24);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                }

                .exams-icon {
                    background: linear-gradient(135deg, #ec4899, #f97316);
                }

                .card-header h2 {
                    font-size: 1.15rem;
                    margin: 0;
                    color: var(--text);
                    font-weight: 700;
                }

                .card-header p {
                    font-size: 0.8rem;
                    margin: 0.15rem 0 0;
                    color: var(--text-secondary);
                }

                .card-body {
                    flex: 1;
                    min-height: 180px;
                    margin-bottom: 1rem;
                }

                .auth-message {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 180px;
                    text-align: center;
                    color: var(--text-secondary);
                }

                .auth-message span {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .auth-message p {
                    margin: 0 0 0.75rem;
                }

                .auth-btn {
                    display: inline-block;
                    padding: 0.6rem 1.5rem;
                    background: linear-gradient(135deg, #ec4899, #f97316);
                    color: white;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.9rem;
                    border-radius: 10px;
                    transition: all 0.3s ease;
                }

                .auth-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 15px rgba(249, 115, 22, 0.4);
                }

                .loading-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                }

                .loading-item {
                    height: 52px;
                    background: linear-gradient(90deg, var(--border) 0%, var(--background) 50%, var(--border) 100%);
                    background-size: 200% 100%;
                    border-radius: 12px;
                    animation: shimmer 1.5s infinite;
                }

                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                .content-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .post-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.65rem 0.75rem;
                    background: var(--background);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    text-decoration: none !important;
                    transition: all 0.2s ease;
                }

                .post-item:hover {
                    border-color: rgba(249, 115, 22, 0.5);
                    background: rgba(249, 115, 22, 0.03);
                }

                .post-item * {
                    text-decoration: none !important;
                }

                .post-rank {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem 0.5rem;
                    background: linear-gradient(135deg, #f97316, #fbbf24);
                    border-radius: 8px;
                    min-width: 32px;
                    min-height: 32px;
                }

                .rank-num {
                    font-size: 0.85rem;
                    color: white;
                    font-weight: 700;
                }

                .post-info {
                    flex: 1;
                    min-width: 0;
                }

                .post-info h4 {
                    font-size: 0.85rem;
                    color: var(--text);
                    margin: 0 0 0.1rem;
                    font-weight: 600;
                    text-decoration: none !important;
                }

                .post-meta {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    text-decoration: none !important;
                }

                .exam-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.65rem 0.75rem;
                    background: var(--background);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }

                .exam-item.urgent {
                    border-color: #ef4444;
                    background: rgba(239, 68, 68, 0.05);
                }

                .exam-date {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 0.35rem 0.5rem;
                    background: linear-gradient(135deg, #ec4899, #f97316);
                    border-radius: 8px;
                    min-width: 48px;
                }

                .date-day {
                    font-size: 0.55rem;
                    color: rgba(255,255,255,0.85);
                    text-transform: uppercase;
                }

                .date-num {
                    font-size: 0.7rem;
                    color: white;
                    font-weight: 700;
                }

                .exam-info {
                    flex: 1;
                }

                .exam-info h4 {
                    font-size: 0.85rem;
                    color: var(--text);
                    margin: 0 0 0.1rem;
                    font-weight: 600;
                }

                .countdown {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .urgent-text {
                    color: #ef4444;
                    font-weight: 600;
                }

                .empty-message {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 180px;
                    text-align: center;
                }

                .empty-message span {
                    font-size: 2.5rem;
                    margin-bottom: 0.5rem;
                }

                .empty-message p {
                    color: var(--text-secondary);
                    margin: 0;
                }

                .card-action {
                    text-decoration: none !important;
                    display: block;
                }

                .action-btn {
                    width: 100%;
                    padding: 0.85rem;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    font-family: inherit;
                    text-decoration: none;
                }

                .primary-btn {
                    background: var(--primary-gradient);
                    color: white;
                }

                .primary-btn:hover {
                    transform: scale(1.02);
                    box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
                }

                .secondary-btn {
                    background: linear-gradient(135deg, #ec4899, #f97316);
                    color: white;
                }

                .secondary-btn:hover {
                    transform: scale(1.02);
                    box-shadow: 0 8px 20px rgba(236, 72, 153, 0.3);
                }

                .btn-arrow {
                    transition: transform 0.3s ease;
                }

                .action-btn:hover .btn-arrow {
                    transform: translateX(4px);
                }

                @media (max-width: 900px) {
                    .features-wrapper {
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .feature-card {
                        width: 100%;
                        max-width: 500px;
                    }
                }

                @media (max-width: 767px) {
                    .features-wrapper {
                        flex-direction: column;
                        gap: 1rem;
                        padding-bottom: 2rem;
                        width: 100%;
                    }

                    .feature-card {
                        padding: 1rem;
                        border-radius: 14px;
                        width: 100%;
                        max-width: 100%;
                    }

                    .card-icon {
                        width: 36px;
                        height: 36px;
                        font-size: 1rem;
                        border-radius: 10px;
                    }

                    .card-header {
                        margin-bottom: 1rem;
                        padding-bottom: 0.75rem;
                    }

                    .card-header h2 {
                        font-size: 0.95rem;
                    }

                    .card-header p {
                        font-size: 0.7rem;
                    }

                    .card-body {
                        min-height: auto;
                        margin-bottom: 0;
                    }

                    .exam-item {
                        padding: 0.5rem 0.6rem;
                        gap: 0.6rem;
                    }

                    .exam-date {
                        min-width: 42px;
                        padding: 0.3rem 0.4rem;
                    }

                    .date-day {
                        font-size: 0.5rem;
                    }

                    .date-num {
                        font-size: 0.65rem;
                    }

                    .exam-info h4 {
                        font-size: 0.8rem;
                    }

                    .countdown {
                        font-size: 0.7rem;
                    }

                    .content-list {
                        gap: 0.4rem;
                    }
                }
            `}</style>
        </div>
    );
}
