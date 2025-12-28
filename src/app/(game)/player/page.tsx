'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';

function PlayerPageContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const { findOrCreatePlayer, getPlayerByName, isLoading } = useGame();
  const hasRun = useRef(false);

  useEffect(() => {
    // This effect ensures the player is created if they don't exist.
    // It runs only once when the component mounts with a valid name.
    if (name && !isLoading && !hasRun.current) {
      findOrCreatePlayer(name);
      hasRun.current = true;
    }
  }, [name, isLoading, findOrCreatePlayer]);

  if (!name) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-10">
        <div>
          <h2 className="text-2xl font-semibold">Player Name Missing</h2>
          <p className="text-muted-foreground mt-2">
            Please join as a player from the home page.
          </p>
        </div>
      </div>
    );
  }

  // Attempt to get the player from the current game state
  const player = getPlayerByName(name);
  
  // If data is still loading OR if the player hasn't appeared in the state yet, show the loading screen.
  // The `!player` check handles the delay between when a player is created in Firestore and when the local state updates.
  if (isLoading || !player) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-10">
        <div>
          <h2 className="text-2xl font-semibold">Joining game...</h2>
          <p className="text-muted-foreground mt-2">
            Your stats will appear here shortly.
          </p>
        </div>
      </div>
    );
  }
  
  // Once the player exists in the local state, render their view.
  return <PlayerView playerName={name} />;
}


export default function PlayerPage() {
  return (
    <Suspense>
      <PlayerPageContent />
    </Suspense>
  );
}
