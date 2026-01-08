'use client';

import React from 'react';

/**
 * Skeleton Loader Component - Facebook/LinkedIn style shimmer effect
 * Usage: <SkeletonLoader variant="card" count={3} />
 */
export default function SkeletonLoader({
    variant = 'card',
    count = 1,
    className = ''
}) {
    const skeletons = Array.from({ length: count }, (_, i) => i);

    const renderSkeleton = () => {
        switch (variant) {
            case 'card':
                return (
                    <div className="skeleton-card">
                        <div className="skeleton-header">
                            <div className="skeleton-avatar"></div>
                            <div className="skeleton-text-group">
                                <div className="skeleton-text skeleton-title"></div>
                                <div className="skeleton-text skeleton-subtitle"></div>
                            </div>
                        </div>
                        <div className="skeleton-content">
                            <div className="skeleton-text skeleton-line"></div>
                            <div className="skeleton-text skeleton-line"></div>
                            <div className="skeleton-text skeleton-line short"></div>
                        </div>
                    </div>
                );

            case 'list':
                return (
                    <div className="skeleton-list-item">
                        <div className="skeleton-avatar small"></div>
                        <div className="skeleton-text-group flex-1">
                            <div className="skeleton-text skeleton-title"></div>
                            <div className="skeleton-text skeleton-subtitle"></div>
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="skeleton-profile">
                        <div className="skeleton-avatar large"></div>
                        <div className="skeleton-text skeleton-title"></div>
                        <div className="skeleton-text skeleton-subtitle"></div>
                        <div className="skeleton-stats">
                            <div className="skeleton-stat"></div>
                            <div className="skeleton-stat"></div>
                            <div className="skeleton-stat"></div>
                        </div>
                    </div>
                );

            default:
                return <div className="skeleton-box"></div>;
        }
    };

    return (
        <div className={`skeleton-container ${className}`}>
            {skeletons.map((_, index) => (
                <div key={index} className="skeleton-wrapper">
                    {renderSkeleton()}
                </div>
            ))}

            <style jsx>{`
                /* Container */
                .skeleton-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    width: 100%;
                }

                .skeleton-wrapper {
                    animation: fade-in 0.3s ease-out;
                }

                /* Base Skeleton Elements */
                .skeleton-box,
                .skeleton-text,
                .skeleton-avatar,
                .skeleton-card,
                .skeleton-list-item,
                .skeleton-profile,
                .skeleton-stat {
                    background: linear-gradient(
                        90deg,
                        var(--secondary) 0%,
                        rgba(139, 92, 246, 0.1) 50%,
                        var(--secondary) 100%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 1.5s ease-in-out infinite;
                    border-radius: 8px;
                }

                /* Card Skeleton */
                .skeleton-card {
                    padding: 1.5rem;
                    border: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .skeleton-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .skeleton-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .skeleton-avatar.small {
                    width: 40px;
                    height: 40px;
                }

                .skeleton-avatar.large {
                    width: 120px;
                    height: 120px;
                    margin: 0 auto;
                }

                .skeleton-text-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    flex: 1;
                }

                .skeleton-text-group.flex-1 {
                    flex: 1;
                }

                .skeleton-text {
                    height: 12px;
                }

                .skeleton-title {
                    width: 60%;
                    height: 16px;
                }

                .skeleton-subtitle {
                    width: 40%;
                    height: 12px;
                }

                .skeleton-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .skeleton-line {
                    width: 100%;
                    height: 12px;
                }

                .skeleton-line.short {
                    width: 70%;
                }

                /* List Item Skeleton */
                .skeleton-list-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                }

                /* Profile Skeleton */
                .skeleton-profile {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    padding: 2rem;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                }

                .skeleton-stats {
                    display: flex;
                    gap: 1rem;
                    width: 100%;
                    margin-top: 1rem;
                }

                .skeleton-stat {
                    flex: 1;
                    height: 60px;
                    border-radius: 12px;
                }

                /* Box Skeleton */
                .skeleton-box {
                    width: 100%;
                    height: 100px;
                }

                /* Shimmer Animation */
                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .skeleton-card,
                    .skeleton-list-item,
                    .skeleton-profile {
                        padding: 1rem;
                    }

                    .skeleton-avatar.large {
                        width: 80px;
                        height: 80px;
                    }
                }
            `}</style>
        </div>
    );
}
