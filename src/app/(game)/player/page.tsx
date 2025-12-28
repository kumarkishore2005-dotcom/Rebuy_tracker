'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlayerView } from '@/components/dashboard/player-view';
import { useGame } from '@/contexts/game-context';

function PlayerPageContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const { findOrCreatePlayer, getPlayerByName, isLoading } = useGame();

  // This effect ensures the player is created if they don't exist.
  // It runs when the component mounts or the player name changes.
  useEffect(() => {
    if (name) {
      findOrCreatePlayer(name);
    }
  }, [name, findOrCreatePlayer]);

  // If the page is loaded without a name, prompt the user to go back.
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
  
  // If the main game data is still loading from Firestore, OR if the specific player 
  // for this page hasn't been found/created in the local state yet, show the loading screen.
  // This provides a robust loading state before rendering the player's view.
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
