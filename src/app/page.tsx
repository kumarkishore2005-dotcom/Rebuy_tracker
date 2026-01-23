'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useFirebase, initiateAnonymousSignIn } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleSelector } from '@/components/auth/role-selector';
import { GameProvider } from '@/contexts/game-context';

function HomePageContent() {
  const { auth, firestore, user, isUserLoading } = useFirebase();
  const bgImage = PlaceHolderImages.find((img) => img.id === 'login-bg');
  const didInitAuth = useRef(false);

  useEffect(() => {
    if (didInitAuth.current) return;
    if (auth && firestore && !user && !isUserLoading) {
      didInitAuth.current = true;
      initiateAnonymousSignIn(auth);
    }
  }, [auth, firestore, user, isUserLoading]);

  if (isUserLoading || !user) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
        {bgImage && (
          <Image
            src={bgImage.imageUrl}
            alt={bgImage.description}
            fill
            priority
            className="object-cover -z-10 brightness-[.25]"
            data-ai-hint={bgImage.imageHint}
          />
        )}
        <div className="text-center text-primary-foreground">
          <h1 className="text-2xl font-bold">Connecting...</h1>
          <p>Initializing your session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          priority
          className="object-cover -z-10 brightness-[.25]"
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-headline text-primary-foreground">Rebuy Tracker</h1>
          <p className="text-accent">Join the game as a player or a dealer.</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle>Join Game</CardTitle>
            <CardDescription>Select your role to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <RoleSelector />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function HomePage() {
    return (
        <GameProvider>
            <HomePageContent />
        </GameProvider>
    )
}
