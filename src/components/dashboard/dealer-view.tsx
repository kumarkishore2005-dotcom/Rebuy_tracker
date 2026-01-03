
"use client";

import { useState } from "react";
import { useGame } from "@/contexts/game-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerList } from "./player-list";
import { Users, Trash, Shuffle } from "lucide-react";
import { ConfirmationDialog } from "../shared/confirmation-dialog";
import { DistroSuggestion } from "./distro-suggestion";
import { useToast } from "@/hooks/use-toast";
import { Totals } from "./totals";

function AddPlayerForm() {
    const [newPlayerName, setNewPlayerName] = useState("");
    const { createPlayer, players } = useGame();
    const { toast } = useToast();
  
    const handleAddPlayer = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = newPlayerName.trim();
      if (trimmedName) {
        const playerExists = players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
        if (playerExists) {
            toast({
                title: 'Player already exists',
                description: `A player named ${trimmedName} is already at the table. Player names must be unique (case-insensitive).`,
                variant: 'destructive',
            });
            return;
        }
        createPlayer(trimmedName);
        setNewPlayerName("");
      }
    };
  
    return (
        <Card>
            <CardHeader>
                <CardTitle>Add New Player</CardTitle>
                <CardDescription>Add a player to the table. They will start with one buy-in.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAddPlayer} className="flex gap-2">
                    <Input
                        placeholder="Player Name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                    />
                    <Button type="submit" disabled={!newPlayerName.trim()}>Add Player</Button>
                </form>
            </CardContent>
      </Card>
    );
}

function ResetGame() {
    const { deleteAllPlayers } = useGame();
    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><Trash/> Reset Game</CardTitle>
                <CardDescription>Remove all players to start a new game.</CardDescription>
            </CardHeader>
            <CardContent>
                <ConfirmationDialog
                    title="Reset Game?"
                    description="Are you sure you want to remove all players? This action cannot be undone."
                    onConfirm={deleteAllPlayers}
                >
                    <Button variant="destructive" className="w-full">
                        Reset Game
                    </Button>
                </ConfirmationDialog>
            </CardContent>
        </Card>
    )
}

export function DealerView() {
  const { players } = useGame();
  return (
    <div className="space-y-8">
        <h1 className="text-4xl font-bold font-headline">Dealer Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <AddPlayerForm />
          <Totals />
          <ResetGame />
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Player Standings</CardTitle>
                    <CardDescription>View all players and manage their re-buys.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PlayerList isDealer={true} />
                </CardContent>
            </Card>

            <DistroSuggestion players={players} />
        </div>
    </div>
  );
}
