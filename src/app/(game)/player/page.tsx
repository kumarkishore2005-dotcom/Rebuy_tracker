'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';

function PlayerPageContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const { addPlayer, getPlayerByName, isLoading } = useGame();

  useEffect(() => {
    if (!isLoading && name && !getPlayerByName(name)) {
      addPlayer(name);
    }
  }, [name, addPlayer, getPlayerByName, isLoading]);

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
  if (!player) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Joining game...</p>
      </div>
    );
  }

  return <PlayerView playerName={name} />;
}

export default function PlayerPage() {
  return (
    <Suspense>
      <PlayerPageContent />
    </Suspense>
  );
}
