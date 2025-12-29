'use client';

import { useUser } from '@/firebase';
import { useGame } from '@/contexts/game-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function JoiningGamePage() {
    const { user, isUserLoading } = useUser();
    const { isReady } = useGame();
    const router = useRouter();

    useEffect(() => {
        // Wait until both auth and game context are fully initialized
        if (isUserLoading || !isReady) {
            return;
        }

        // Once everything is ready, redirect to home
        router.replace('/');

    }, [isUserLoading, isReady, router]);

    return (
        <div className="flex flex-col min-h-screen items-center justify-center text-center">
            <h1 className="text-3xl font-bold font-headline">Connecting...</h1>
            <p className="text-muted-foreground mt-2">
                Establishing a secure connection to the game.
            </p>
        </div>
    );
}
