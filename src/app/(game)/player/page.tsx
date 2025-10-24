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
    if (!isLoading && name && !hasRun.current) {
        findOrCreatePlayer(name);
        hasRun.current = true;
    }
  }, [isLoading, name, findOrCreatePlayer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

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

  const player = getPlayerByName(name);
  if (!player) {
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

  return <PlayerView playerName={name} />;
}

export default function PlayerPage() {
  return (
    <Suspense>
      <PlayerPageContent />
    </Suspense>
  );
}
