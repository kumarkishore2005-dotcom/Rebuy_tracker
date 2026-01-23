'use client';

import { AppHeader } from '@/components/dashboard/app-header';
import { Suspense, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { GameProvider } from '@/contexts/game-context';

function GameLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Wait for Firebase auth to load
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/'); // Redirect if not logged in
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-10">
        <div>
          <h2 className="text-2xl font-semibold">Connecting...</h2>
          <p className="text-muted-foreground mt-2">
            Loading your session details.
          </p>
        </div>
      </div>
    );
  }

  // Prevent flash of wrong page before redirect
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1">
      <Suspense>
        <AppHeader />
      </Suspense>
      <main className="flex-1 container mx-auto py-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}


export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GameProvider>
      <div className="flex flex-col min-h-screen">
        <GameLayoutContent>{children}</GameLayoutContent>
      </div>
    </GameProvider>
  );
}
