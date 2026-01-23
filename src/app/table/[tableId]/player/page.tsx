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
  // useGame is now scoped to the tableId provided in the layout
  const { players, isLoading, createPlayer } = useGame();

  // This effect is still useful for robustness, e.g. if a player bookmarks the page
  // and joins directly. It ensures their player document is created if it's missing.
  useEffect(() => {
    if (name) {
      createPlayer(name);
    }
  }, [name, createPlayer]);

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
  
  if (isLoading || !player) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-10">
        <div>
          <h2 className="text-2xl font-semibold">Joining table...</h2>
          <p className="text-muted-foreground mt-2">
            Your stats will appear here shortly.
          </p>
        </div>
      </div>
    );
  }
  
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
