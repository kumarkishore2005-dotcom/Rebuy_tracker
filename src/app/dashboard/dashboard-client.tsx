
'use client';

import { DealerView } from '@/components/dashboard/dealer-view';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Loading dashboard...</p>
    </div>
  );
}

export default function DashboardClient({ role: initialRole, name: initialName }: { role?: string; name?: string }) {
  const searchParams = useSearchParams();
  const { addPlayer, getPlayerByName, isLoading } = useGame();
  
  const role = searchParams.get('role') || initialRole;
  const name = searchParams.get('name') || initialName;

  useEffect(() => {
    if (role === 'player' && name) {
      if (!getPlayerByName(name)) {
        addPlayer(name);
      }
    }
  }, [role, name, addPlayer, getPlayerByName]);
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (role === 'dealer') {
    return <DealerView />;
  }

  if (role === 'player' && name) {
    const player = getPlayerByName(name);
    return player ? <PlayerView playerName={name} /> : <DashboardSkeleton />;
  }
  
  // Fallback view
  return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Welcome to the Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Select a role from the home page to get started.
        </p>
      </div>
  );
}
