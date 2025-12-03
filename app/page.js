'use client';

import { generateMetaTags } from '@/lib/seo';

// Note: In Next.js 13+, metadata should ideally be exported from server components
// Since this is a client component, metadata is handled in layout.js

import Card from '@/components/Card';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Import generated assets (assuming they are placed in public folder, but for now we will use absolute paths or placeholders if not moved. 
// Since I cannot move files easily to public without a command, I will use the absolute paths for now or assume they are accessible.
// Actually, Next.js Image component requires assets to be in public or imported.
// I will use standard img tags with absolute paths for this draft or just placeholders if I can't move them.
// Wait, I can use the `file://` protocol for local development if configured, but Next.js might block it.
// Best approach: I will assume I can move them to public/images.
// I'll add a step to move images to public/images.

import Hero from '@/components/Hero';
import FeaturesSection from '@/components/FeaturesSection';

export default function Home() {
    const { status } = useSession();

    return (
        <div>
            <Hero />
            <FeaturesSection />
        </div>
    )
}
