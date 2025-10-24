
'use client';

import { DealerView } from '@/components/dashboard/dealer-view';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
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
  const searchParams = useSearchParams();
  const { addPlayer, getPlayerByName, isLoading } = useGame();
  
  const currentRole = searchParams.get('role');

  useEffect(() => {
    if (isLoading || !currentRole) {
      return; // Wait until loading is done and we know the role
    }

    // Handle Player joining
    if (currentRole === 'player') {
      const currentName = searchParams.get('name');
      if (currentName && !getPlayerByName(currentName)) {
        addPlayer(currentName);
      }
    }

  }, [isLoading, currentRole, addPlayer, getPlayerByName, searchParams]);
  
  if (isLoading && !currentRole) {
    return <DashboardSkeleton />;
  }

  if (currentRole === 'dealer') {
    return <DealerView />;
  }

  if (currentRole === 'player' && name) {
    return <PlayerView playerName={name} />;
  }

  // Fallback for invalid states or while redirects are happening.
  return <DashboardSkeleton />;
}
