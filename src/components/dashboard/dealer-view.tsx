
"use client";

import { useState } from "react";
import { useGame } from "@/contexts/game-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerList } from "./player-list";
import { DollarSign, Users, Clock, Trash, ListChecks } from "lucide-react";
import { ConfirmationDialog } from "../shared/confirmation-dialog";
import { ActionLog } from "./action-log";

function AddPlayerForm() {
    const [newPlayerName, setNewPlayerName] = useState("");
    const { addPlayer } = useGame();
  
    const handleAddPlayer = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPlayerName.trim()) {
        addPlayer(newPlayerName.trim());
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

function TotalBuyIns() {
    const { players } = useGame();
    const totalBuyIns = players.reduce((total, player) => total + (player.rebuys ?? 0), 0);

    return (
        <Card className="bg-secondary">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign /> Total Buy-ins</CardTitle>
                <CardDescription>The total number of buy-ins from all players.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-5xl font-bold">{totalBuyIns}</p>
            </CardContent>
        </Card>
    );
}

function ResetGame() {
    const { deleteAllPlayersAndLogs } = useGame();
    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><Trash/> Reset Game</CardTitle>
                <CardDescription>Remove all players and logs to start a new game.</CardDescription>
            </CardHeader>
            <CardContent>
                <ConfirmationDialog
                    title="Reset Game?"
                    description="Are you sure you want to remove all players and logs? This action cannot be undone."
                    onConfirm={deleteAllPlayersAndLogs}
                >
                    <Button variant="destructive" className="w-full">
                        Reset Game
                    </Button>
                </ConfirmationDialog>
            </CardContent>
        </Card>
    )
}

function SyncTest() {
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground shadow-lg">
                <Clock className="h-5 w-5 text-primary" />
                <span>State: <strong>Live</strong></span>
            </div>
        </div>
    )
}

export function DealerView() {
  return (
    <div className="space-y-8">
        <h1 className="text-4xl font-bold font-headline">Dealer Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AddPlayerForm />
          <TotalBuyIns />
          <ResetGame />
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users /> Player Standings</CardTitle>
                        <CardDescription>View all players and manage their re-buys.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PlayerList isDealer={true} />
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ListChecks /> Action Log</CardTitle>
                        <CardDescription>A real-time log of all game events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ActionLog />
                    </CardContent>
                </Card>
            </div>
        </div>

        <SyncTest />
    </div>
  );
}
