'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing loading states
 * Usage:
 * const { isLoading, startLoading, stopLoading, withLoading } = useLoading();
 * 
 * // Automatic loading wrapper
 * await withLoading(async () => {
 *   await fetchData();
 * });
 */
export default function useLoading(initialState = false) {
    const [isLoading, setIsLoading] = useState(initialState);
    const [error, setError] = useState(null);

    const startLoading = useCallback(() => {
        setIsLoading(true);
        setError(null);
    }, []);

    const stopLoading = useCallback(() => {
        setIsLoading(false);
    }, []);

    const setLoadingError = useCallback((err) => {
        setError(err);
        setIsLoading(false);
    }, []);

    /**
     * Wraps an async function with automatic loading state management
     * and optional timeout protection
     */
    const withLoading = useCallback(async (asyncFn, options = {}) => {
        const { timeout = 30000, onError } = options;

        try {
            startLoading();

            // Create timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), timeout);
            });

            // Race between the async function and timeout
            const result = await Promise.race([
                asyncFn(),
                timeoutPromise
            ]);

            stopLoading();
            return result;

        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setLoadingError(errorMessage);

            if (onError) {
                onError(err);
            }

            throw err;
        }
    }, [startLoading, stopLoading, setLoadingError]);

    return {
        isLoading,
        error,
        startLoading,
        stopLoading,
        setError: setLoadingError,
        withLoading
    };
}
