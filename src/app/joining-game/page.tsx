'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is part of the old flow. It now just redirects to the new homepage.
export default function JoiningGamePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return (
        <div className="flex flex-col min-h-screen items-center justify-center text-center">
            <h1 className="text-3xl font-bold font-headline">Redirecting...</h1>
        </div>
    );
}
