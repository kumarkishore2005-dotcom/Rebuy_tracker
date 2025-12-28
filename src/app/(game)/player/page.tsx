'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';

// Force this page to be dynamically rendered to prevent static pre-rendering issues.
export const dynamic = 'force-dynamic';

function PlayerPageContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const { createPlayer, players, isLoading } = useGame();

  // This effect runs once when the component mounts with a valid name.
  // It ensures the player exists in Firestore.
  useEffect(() => {
    if (name) {
      createPlayer(name);
    }
    // The dependency array ensures this only re-runs if the name or function reference changes.
  }, [name, createPlayer]); 

  // Attempt to get the player from the current state. This will be undefined
  // until the data loads from Firestore.
  const player = players?.find(p => p.name === name);

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
  
  // Show a loading screen if the game data is loading from Firestore 
  // OR if we are waiting for the specific player to appear in the local state.
  // When `useGame`'s `players` array updates, this component will re-render,
  // `player` will be found, and this condition will become false.
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
  
  // Once the player object is available, render their view.
  return <PlayerView playerName={name} />;
}


export default function PlayerPage() {
  return (
    // Suspense is required for pages that use `useSearchParams`.
    <Suspense>
      <PlayerPageContent />
    </Suspense>
  );
}
