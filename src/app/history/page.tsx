
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useCollection } from '@/firebase';
import { collection, CollectionReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Banknote, DollarSign, TrendingDown, TrendingUp, History } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Timestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

interface GamePlayer {
    name: string;
    buyIns: number;
    blackCoins: number;
    endCount: number;
}

interface Game {
    id: string;
    endedAt: Timestamp;
    players: GamePlayer[];
}

function GameHistorySkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                            <div className="text-right">
                                <Skeleton className="h-6 w-12" />
                                <Skeleton className="h-4 w-20 mt-1" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function HistoryPage() {
  const firestore = useFirestore();

  const gamesColRef = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'games') as CollectionReference<Omit<Game, 'id'>>;
  }, [firestore]);

  const { data: games, isLoading } = useCollection<Omit<Game, 'id'>>(gamesColRef);

  const sortedGames = useMemo(() => {
    if (!games) return [];
    return [...games].sort((a, b) => b.endedAt.toMillis() - a.endedAt.toMillis());
  }, [games]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold font-headline">Game History for Tom</h1>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Link>
            </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-8">
        {isLoading && <GameHistorySkeleton />}
        {!isLoading && sortedGames.length === 0 && (
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold">No History Found</h2>
            <p className="text-muted-foreground mt-2">
              Completed game data for 'Tom' will appear here.
            </p>
          </div>
        )}
        {!isLoading && sortedGames.length > 0 && (
          <div className="space-y-6">
            {sortedGames.map((game) => (
              <Card key={game.id}>
                <CardHeader>
                  <CardTitle>
                    Game Ended: {format(game.endedAt.toDate(), "MMMM d, yyyy 'at' h:mm a")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {game.players.map((player) => (
                    <div key={player.name} className="flex justify-between items-center p-4 rounded-lg bg-muted">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                             <div className={cn("flex items-center justify-center h-10 w-10 rounded-full font-bold text-lg", player.endCount >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700" )}>
                                {player.endCount > 0 ? `+${player.endCount}` : player.endCount}
                            </div>
                            <div>
                                <p className="font-bold text-lg">{player.name}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1" title="Buy-ins">
                                        <DollarSign className="h-4 w-4" />
                                        <span>{player.buyIns}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Black Coins">
                                        <Banknote className="h-4 w-4" />
                                        <span>{player.blackCoins}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                           <p className={cn("text-2xl font-bold", player.endCount >= 0 ? "text-green-600" : "text-destructive")}>
                             {player.endCount > 0 ? "Win" : player.endCount < 0 ? "Loss" : "Break Even"}
                           </p>
                           {player.endCount >= 0 ? 
                                <TrendingUp className={cn("ml-auto h-5 w-5", player.endCount > 0 ? "text-green-600" : "text-muted-foreground")} /> : 
                                <TrendingDown className="ml-auto h-5 w-5 text-destructive" />
                           }
                        </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
