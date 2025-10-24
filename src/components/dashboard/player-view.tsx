
"use client";

import { useGame } from "@/contexts/game-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerList } from "./player-list";
import { Users, Clock } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface PlayerViewProps {
  playerName: string;
}

function SyncTest() {
    const { lastUpdated } = useGame();
    const formattedTime = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'N/A';
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground shadow-lg">
                <Clock className="h-5 w-5 text-primary" />
                <span>Last Sync: <strong>{formattedTime}</strong></span>
            </div>
        </div>
    )
}

function PlayerViewSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-1/2" />
      <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Your Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex gap-8">
            <div>
              <p className="text-sm">Total Buy-ins</p>
              <Skeleton className="h-14 w-12 mt-1" />
            </div>
            <div>
              <p className="text-sm">End Count</p>
              <Skeleton className="h-14 w-12 mt-1" />
            </div>
          </div>
          <Skeleton className="h-12 w-36" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users /> Table Standings
          </CardTitle>
          <CardDescription>
            See how you stack up against the competition.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function PlayerView({ playerName }: PlayerViewProps) {
  const { getPlayerByName, addRebuy, isLoading } = useGame();
  
  if (isLoading) {
    return <PlayerViewSkeleton />;
  }

  const player = getPlayerByName(playerName);

  if (!player) {
    return (
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold">Waiting for the dealer to add you to the game...</h2>
          <p className="text-muted-foreground mt-2">
            Once you're added, your stats will appear here.
          </p>
      </div>
    )
  }
  
  const totalBuyins = player.rebuys;
  const endCount = player.blackCoins - player.rebuys;
  
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold font-headline">Welcome, {playerName}!</h1>
      
      <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Your Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex gap-8">
            <div>
              <p className="text-sm">Total Buy-ins</p>
              <p className="text-5xl font-bold">{totalBuyins}</p>
            </div>
            <div>
              <p className="text-sm">End Count</p>
              <p className="text-5xl font-bold">{endCount}</p>
            </div>
          </div>
          <Button 
            onClick={() => addRebuy(player.id)} 
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            size="lg"
          >
            Request Re-buy
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Table Standings</CardTitle>
          <CardDescription>See how you stack up against the competition.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerList highlightPlayerName={playerName} />
        </CardContent>
      </Card>
      <SyncTest />
    </div>
  );
}
