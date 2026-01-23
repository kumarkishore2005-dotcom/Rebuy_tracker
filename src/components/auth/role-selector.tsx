
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, UserCog, History, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGame } from "@/contexts/game-context";

const PLAYER_NAME_KEY = "poker_player_name";

// This component now directs to the global /player and /dealer pages
export function RoleSelector() {
  const [playerName, setPlayerName] = useState("");
  const [savedPlayerName, setSavedPlayerName] = useState<string | null>(null);
  const router = useRouter();
  const { players } = useGame();

  const predefinedPlayers = useMemo(() => {
    const names = ["Ramki", "Mallik", "Srikanth M", "Kumar", "Nagesh", "Siva", "Tom", "Anil", "Shashank"];
    const playerNames = new Set(players.map(p => p.name));
    names.forEach(name => playerNames.add(name));
    return Array.from(playerNames).sort();
  }, [players]);


  useEffect(() => {
    try {
      const savedName = localStorage.getItem(PLAYER_NAME_KEY);
      setSavedPlayerName(savedName);
      if (savedName) {
        setPlayerName(savedName);
      }
    } catch (e) {
      console.error("Could not access localStorage.", e);
    }
  }, []);

  const handlePlayerJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = playerName.trim();
    if (trimmedName) {
      try {
        localStorage.setItem(PLAYER_NAME_KEY, trimmedName);
      } catch (e) {
        console.error("Could not set item in localStorage.", e);
      }
      // Navigate to the global player page
      router.push(`/player?name=${encodeURIComponent(trimmedName)}`);
    }
  };
  
  const handleDealerJoin = () => {
    // Navigate to the global dealer page
    router.push(`/dealer`);
  };

  const handleResumeSession = () => {
    if (savedPlayerName) {
      router.push(`/player?name=${encodeURIComponent(savedPlayerName)}`);
    }
  };

  const handleJoinAsNew = () => {
    try {
      localStorage.removeItem(PLAYER_NAME_KEY);
    } catch (e) {
      console.error("Could not remove item from localStorage.", e);
    }
    setSavedPlayerName(null);
    setPlayerName("");
  };

  if (savedPlayerName) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-primary-foreground/80">
          Welcome back, <strong className="font-bold text-accent">{savedPlayerName}</strong>!
        </p>
        <Button onClick={handleResumeSession} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <History className="mr-2 h-4 w-4" />
          Resume Session
        </Button>
        <Button onClick={handleJoinAsNew} variant="link" className="w-full text-primary-foreground/60">
          Join as new player
        </Button>
      </div>
    );
  }

  return (
    <Tabs defaultValue="player" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-primary/20">
        <TabsTrigger value="player" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <User className="mr-2 h-4 w-4" /> Player
        </TabsTrigger>
        <TabsTrigger value="dealer" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <UserCog className="mr-2 h-4 w-4" /> Dealer
        </TabsTrigger>
      </TabsList>
      <TabsContent value="player" className="mt-4 space-y-4">
        <form onSubmit={handlePlayerJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-primary-foreground">Player Name</Label>
            <Input
              id="name"
              placeholder="Enter your name to join"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
              className="bg-background/80 text-foreground"
            />
          </div>

          <div className="space-y-2">
              <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-primary-foreground/60">
                      Or select existing
                      </span>
                  </div>
              </div>
              <Select onValueChange={(value) => setPlayerName(value)}>
                  <SelectTrigger className="bg-background/80 text-foreground">
                      <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select from players..." />
                      </div>
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-48">
                      {predefinedPlayers.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
              </Select>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!playerName.trim()}>
            Join Game
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="dealer" className="mt-4">
         <div className="space-y-4 text-center">
            <p className="text-primary-foreground/80">
                Proceed to the password-protected dashboard to manage the game.
            </p>
            <Button onClick={handleDealerJoin} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Enter as Dealer
            </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
