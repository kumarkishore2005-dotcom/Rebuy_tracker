
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
    // Automatically add the player if they don't exist in the game state yet.
    // This happens when a new player joins.
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

  // After the useEffect runs, the player should exist.
  const player = getPlayerByName(name);

  // If for some reason the player still isn't found (e.g., during initial loading),
  // show a loading message instead of the "waiting for dealer" one.
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
