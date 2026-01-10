
'use client';

import { useGame } from "@/contexts/game-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerList } from "./player-list";
import { Users, Clock, PlusCircle } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { ConfirmationDialog } from "../shared/confirmation-dialog";

interface PlayerViewProps {
  playerName: string;
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
          <div>
            <p className="text-sm">Total Buy-ins</p>
            <Skeleton className="h-14 w-12 mt-1" />
          </div>
          <Skeleton className="h-10 w-32" />
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
  const { players, requestRebuy, isLoading } = useGame();
  
  if (isLoading) {
    return <PlayerViewSkeleton />;
  }

  const player = players.find(p => p.name === playerName);

  if (!player) {
    return (
      <div className="flex-1 flex items-center justify-center text-center py-10">
        <div>
            <h2 className="text-2xl font-semibold">Waiting for the dealer...</h2>
            <p className="text-muted-foreground mt-2">
            Your name will appear on the list once the dealer has added you to the game.
            </p>
        </div>
      </div>
    );
  }
  
  const totalBuyins = player.rebuyTimestamps?.length ?? 0;
  
  const handleRebuyRequest = () => {
    requestRebuy(player.id);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold font-headline">Welcome, {playerName}!</h1>
      
      <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Your Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm">Total Buy-ins</p>
            <p className="text-5xl font-bold">{totalBuyins}</p>
          </div>
          {player.hasPendingRebuyRequest ? (
             <Button size="lg" disabled className="bg-accent/50 text-accent-foreground">
                <Clock className="mr-2 h-5 w-5 animate-spin" />
                Request Pending...
             </Button>
          ) : (
            <ConfirmationDialog
              title="Confirm Re-buy Request"
              description="Are you sure you want to request a re-buy? The dealer will be notified."
              onConfirm={handleRebuyRequest}
            >
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Request Re-buy
              </Button>
            </ConfirmationDialog>
          )}
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
    </div>
  );
}
