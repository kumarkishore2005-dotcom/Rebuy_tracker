
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';
import { useEffect } from 'react';

function PlayerPageContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const { addPlayer, getPlayerByName, isLoading } = useGame();

  useEffect(() => {
    if (name && !getPlayerByName(name)) {
      addPlayer(name);
    }
  }, [name, addPlayer, getPlayerByName]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      );
  }

  if (!name) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Player Name Missing</h2>
        <p className="text-muted-foreground mt-2">
          Please join as a player from the home page.
        </p>
      </div>
    );
  }

  const player = getPlayerByName(name);
  return player ? <PlayerView playerName={name} /> : 
    (
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold">Waiting for the dealer...</h2>
          <p className="text-muted-foreground mt-2">
            You will be added to the game shortly.
          </p>
        </div>
    );
}

export default function PlayerPage() {
  return (
    <Suspense>
        <PlayerPageContent />
    </Suspense>
  );
}
