'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function FeaturesSection() {
    const { status } = useSession();
    const [forumPosts, setForumPosts] = useState([]);
    const [sharedNotes, setSharedNotes] = useState([]);
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rotationIndex, setRotationIndex] = useState(0);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchDynamicContent();
        }
    }, [status]);

    // Rotate content every 10 seconds
    useEffect(() => {
        if (status === 'authenticated' && (forumPosts.length > 3 || sharedNotes.length > 3)) {
            const interval = setInterval(() => {
                setRotationIndex(prev => prev + 1);
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [status, forumPosts.length, sharedNotes.length]);

    const fetchDynamicContent = async () => {
        try {
            // Fetch forum posts (sort by views)
            const forumRes = await fetch('/api/forum/posts');
            if (forumRes.ok) {
                const forumData = await forumRes.json();
                const posts = forumData.posts || [];
                const filtered = posts
                    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                    .slice(0, 6); // Get top 6 for rotation
                setForumPosts(filtered);
            }

            // Fetch shared notes (posts with files attached)
            const notesRes = await fetch('/api/forum/posts');
            if (notesRes.ok) {
                const notesData = await notesRes.json();
                const posts = notesData.posts || [];
                const shared = posts
                    .filter(post => post.fileUrls && JSON.parse(post.fileUrls).length > 0)
                    .slice(0, 6); // Get 6 for rotation
                setSharedNotes(shared);
            }

            // Fetch courses with upcoming exams
            const coursesRes = await fetch('/api/courses');
            const courseExams = [];
            if (coursesRes.ok) {
                const coursesData = await coursesRes.json();
                coursesData
                    .filter(course => course.examDate && new Date(course.examDate) > new Date())
                    .forEach(course => {
                        courseExams.push({
                            code: course.code,
                            examDate: course.examDate,
                            source: 'course'
                        });
                    });
            }

            // Fetch exam tasks from tasks API
            const tasksRes = await fetch('/api/tasks');
            if (tasksRes.ok) {
                const tasksData = await tasksRes.json();
                tasksData
                    .filter(task => task.category === 'EXAM' && task.dueDate && new Date(task.dueDate) > new Date())
                    .forEach(task => {
                        courseExams.push({
                            code: task.title,
                            examDate: task.dueDate,
                            source: 'task'
                        });
                    });
            }

            // Sort all exams by date and take top 8
            const sortedExams = courseExams
                .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
                .slice(0, 8);
            setUpcomingExams(sortedExams);
        } catch (error) {
            console.error('Error fetching dynamic content:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get rotated content (show 3 items at a time, rotate through all)
    const getRotatedItems = (items, count = 3) => {
        if (items.length === 0) return [];
        const startIndex = rotationIndex % Math.max(1, items.length - count + 1);
        return items.slice(startIndex, startIndex + count);
    };

    const features = [
        {
            title: "Sorular & Cevaplar",
            description: "Takıldığın yerleri sor, diğer öğrencilerden yardım al.",
            icon: "💬",
            gradient: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
            link: "/topluluk",
            linkText: "Topluluğa Git",
            content: loading ? [{ text: 'Yükleniyor...', bold: false }] :
                forumPosts.length > 0
                    ? getRotatedItems(forumPosts).map(post => ({
                        text: post.title.substring(0, 60) + (post.title.length > 60 ? '...' : ''),
                        bold: true,
                        views: post.viewCount || 0
                    }))
                    : [{ text: 'Henüz soru sorulmamış', bold: false }, { text: 'İlk soruyu sen sor!', bold: false }],
            authMessage: "Giriş yaparak tartışmalara katıl."
        },
        {
            title: "Popüler Notlar",
            description: "En çok indirilen ve beğenilen ders notları.",
            icon: "📝",
            gradient: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
            link: "/topluluk?showNotes=true",
            linkText: "Notlara Göz At",
            content: loading ? [{ text: 'Yükleniyor...', bold: false }] :
                sharedNotes.length > 0
                    ? getRotatedItems(sharedNotes).map(note => ({
                        text: note.title.substring(0, 60),
                        bold: true
                    }))
                    : [{ text: 'Henüz not paylaşılmamış', bold: false }, { text: 'İlk notu sen paylaş!', bold: false }],
            authMessage: "Notları görmek için giriş yap."
        },
        {
            title: "Yaklaşan Sınavlar",
            description: "Sınav takvimini takip et, hazırlıksız yakalanma.",
            icon: "📅",
            gradient: "linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%)",
            link: "/courses",
            linkText: null,
            content: loading ? [{ text: 'Yükleniyor...', bold: false }] :
                upcomingExams.length > 0
                    ? upcomingExams.map((course, index) => {
                        const examDate = new Date(course.examDate);
                        const dayName = examDate.toLocaleDateString('tr-TR', { weekday: 'long' });
                        const formattedDate = examDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                        // Check if time is set using UTC (not 00:00)
                        const utcHours = examDate.getUTCHours();
                        const utcMinutes = examDate.getUTCMinutes();
                        const hasTime = utcHours !== 0 || utcMinutes !== 0;
                        const timeStr = hasTime ? ' ' + examDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

                        // Font size decreases: 1.05rem -> 0.8rem
                        const fontSize = Math.max(0.8, 1.05 - (index * 0.05));

                        // Opacity decreases: 1.0 -> 0.5
                        const opacity = Math.max(0.5, 1 - (index * 0.1));

                        return {
                            text: `${course.code} - ${dayName}, ${formattedDate}${timeStr}`,
                            bold: index === 0,
                            fontSize: `${fontSize}rem`,
                            opacity: opacity
                        };
                    })
                    : [{ text: 'Henüz sınav tarihi girilmemiş', bold: false }],
            authMessage: "Sınav takvimi için giriş yap."
        }
    ];

    return (
        <div className="features-grid">
            {features.map((feature, index) => (
                <div key={index} className="feature-card-wrapper">
                    <div className="feature-gradient-bg" style={{
                        background: feature.gradient
                    }} />

                    <div className="feature-card">
                        <div className="feature-icon" style={{
                            background: feature.gradient
                        }}>
                            {feature.icon}
                        </div>

                        <h3 className="feature-title">
                            {feature.title}
                        </h3>

                        <p className="feature-description">
                            {feature.description}
                        </p>

                        {status === 'authenticated' ? (
                            <div className="feature-content">
                                <ul className="feature-list">
                                    {feature.content.map((item, i) => {
                                        const isObject = typeof item === 'object';
                                        const text = isObject ? item.text : item;
                                        const isBold = isObject ? item.bold : false;
                                        const hasBadge = isObject ? item.badge : false;
                                        const fontSize = isObject ? item.fontSize : '0.95rem';
                                        const opacity = isObject && item.opacity !== undefined ? item.opacity : 1;

                                        return (
                                            <li key={i} className="feature-list-item" style={{ fontSize }}>
                                                <span className="feature-bullet">•</span>

                                                <span style={{
                                                    fontWeight: isBold ? '700' : '400',
                                                    opacity: opacity
                                                }}>
                                                    {text}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {feature.linkText && (
                                    <Link href={feature.link} className="feature-link">
                                        <span className="feature-link-text">
                                            {feature.linkText} &rarr;
                                        </span>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="feature-auth-message">
                                <p>
                                    {feature.authMessage}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            <style jsx>{`
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 2.5rem;
                    padding: 2rem 0;
                }

                .feature-card-wrapper {
                    position: relative;
                    background: var(--secondary);
                    border-radius: 24px;
                    padding: 2px;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    cursor: default;
                }

                .feature-card-wrapper:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.12);
                }

                .feature-gradient-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 24px;
                    opacity: 0.5;
                    z-index: 0;
                }

                .feature-card {
                    position: relative;
                    background: var(--background);
                    border-radius: 22px;
                    padding: 2.5rem;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    z-index: 1;
                }

                .feature-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }

                .feature-title {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: var(--text);
                    font-weight: bold;
                }

                .feature-description {
                    color: var(--text-secondary);
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }

                .feature-content {
                    margin-top: auto;
                }

                .feature-list {
                    padding-left: 0;
                    list-style: none;
                    margin-bottom: 1.5rem;
                }

                .feature-list-item {
                    margin-bottom: 0.8rem;
                    color: var(--text);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .feature-bullet {
                    color: var(--primary);
                    font-size: 1.2rem;
                }

                .feature-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    text-decoration: none;
                }

                .feature-link-text {
                    color: var(--text);
                    font-weight: bold;
                    font-size: 1rem;
                    padding: 0.8rem 1.5rem;
                    border-radius: 50px;
                    border: 1px solid var(--border);
                    transition: all 0.2s ease;
                    display: inline-block;
                }

                .feature-link:hover .feature-link-text {
                    background: var(--gradient);
                    color: white;
                    border-color: transparent;
                }

                .feature-auth-message {
                    margin-top: auto;
                    padding: 1rem;
                    background: var(--secondary);
                    border-radius: 12px;
                    text-align: center;
                }

                .feature-auth-message p {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    margin: 0;
                }

                @media (max-width: 767px) {
                    .features-grid {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                        padding: 1rem 0;
                    }

                    .feature-card {
                        padding: 2rem 1.5rem;
                    }

                    .feature-icon {
                        width: 50px;
                        height: 50px;
                        font-size: 1.75rem;
                        margin-bottom: 1rem;
                    }

                    .feature-title {
                        font-size: 1.3rem;
                    }

                    .feature-description {
                        font-size: 0.95rem;
                        margin-bottom: 1.5rem;
                    }

                    .feature-list-item {
                        font-size: 0.9rem;
                        margin-bottom: 0.6rem;
                    }

                    .feature-link-text {
                        font-size: 0.95rem;
                        padding: 0.7rem 1.2rem;
                        width: 100%;
                        text-align: center;
                    }

                    .feature-card-wrapper:hover {
                        transform: translateY(-5px);
                    }
                }

                @media (max-width: 360px) {
                    .feature-card {
                        padding: 1.5rem 1rem;
                    }

                    .feature-title {
                        font-size: 1.2rem;
                    }

                    .feature-description {
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </div>
    );
}
