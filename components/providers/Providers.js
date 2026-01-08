'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function Providers({ children }) {
    return (
        <SessionProvider refetchOnWindowFocus={true}>
            <ThemeProvider>
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
