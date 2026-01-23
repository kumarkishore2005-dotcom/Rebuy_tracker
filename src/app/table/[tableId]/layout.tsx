'use client';

import { AppHeader } from '@/components/dashboard/app-header';
import { Suspense, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { GameProvider } from '@/contexts/game-context';

function GameLayoutContent({
  children,
  tableId,
}: {
  children: React.ReactNode;
  tableId: string;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/'); // Redirect to table selection if not logged in
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

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1">
      <Suspense>
        <AppHeader tableId={tableId} />
      </Suspense>
      <main className="flex-1 container mx-auto py-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}

export default function TableLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tableId: string };
}) {
  return (
    // GameProvider now wraps only the specific table layout
    <GameProvider tableId={params.tableId}>
      <div className="flex flex-col min-h-screen">
        <GameLayoutContent tableId={params.tableId}>{children}</GameLayoutContent>
      </div>
    </GameProvider>
  );
}
