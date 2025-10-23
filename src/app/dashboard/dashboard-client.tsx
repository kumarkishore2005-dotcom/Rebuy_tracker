'use client';

import { DealerView } from '@/components/dashboard/dealer-view';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-1/4" />
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function DashboardClient({ role, name }: { role?: string; name?: string }) {
  const router = useRouter();
  const { addPlayer, getPlayerByName } = useGame();
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentRole = searchParams.get('role');
    const currentName = searchParams.get('name');

    // Wait until user loading is complete before doing anything
    if (isUserLoading) {
      return;
    }

    // Scenario 1: User has just logged in (user object is present), but role isn't in URL yet.
    // This happens right after the redirect from Google sign-in.
    // Or, user is logged in and visits /dashboard without a role.
    if (user && !currentRole) {
      router.replace('/dashboard?role=dealer');
      return;
    }

    // Scenario 2: A non-logged-in user tries to access the dealer dashboard.
    if (currentRole === 'dealer' && !user) {
      router.replace('/');
      return;
    }
    
    // Scenario 3: A player joins the game.
    if (currentRole === 'player' && currentName) {
      const playerExists = getPlayerByName(currentName);
      if (!playerExists) {
        addPlayer(currentName);
      }
    }
    
  }, [user, isUserLoading, router, addPlayer, getPlayerByName, searchParams]);

  if (isUserLoading) {
    return <DashboardSkeleton />;
  }

  const currentRole = searchParams.get('role');
  
  if (currentRole === 'dealer' && user) {
    return <DealerView />;
  }

  if (currentRole === 'player' && name) {
    return <PlayerView playerName={name} />;
  }

  // Fallback while redirecting or for invalid states.
  // This will show while the useEffect is determining the correct route.
  return <DashboardSkeleton />;
}
