'use client';

import React, { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

export default function SplashScreen({ children }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Show splash screen for 1.5 seconds on every load
        // This includes: page refresh, login, logout, and navigation
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}
