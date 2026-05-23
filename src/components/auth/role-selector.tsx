"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, UserCog, History, Users, Layers } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGame } from "@/contexts/game-context";
import { useFirebase, useCollection } from "@/firebase";
import { collection } from "firebase/firestore";

const PLAYER_NAME_KEY = "poker_player_name";

export function RoleSelector() {
  const { firestore, user } = useFirebase();
  const [playerName, setPlayerName] = useState("");
  const [tableId, setTableId] = useState("");
  const [isCreatingNewTable, setIsCreatingNewTable] = useState(false);
  const [newTableId, setNewTableId] = useState("");
  const [savedPlayerName, setSavedPlayerName] = useState<string | null>(null);
  
  const router = useRouter();
  const { players } = useGame();

  const predefinedPlayers = useMemo(() => {
    const names = ["Ramki", "Mallik", "Srikanth M", "Kumar", "Nagesh", "Siva", "Tom", "Anil", "Shashank"];
    const playerNames = new Set((players || []).map(p => p.name));
    names.forEach(name => playerNames.add(name));
    return Array.from(playerNames).sort();
  }, [players]);

  const tablesColRef = useMemo(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'tables');
  }, [firestore, user]);

  const { data: tables = [], isLoading: isTablesLoading } = useCollection<{ id: string; lastActive?: any }>(tablesColRef);

  const activeTables = useMemo(() => {
    const list = tables || [];
    return [...list].sort((a, b) => {
      const aTime = a.lastActive?.toMillis() || 0;
      const bTime = b.lastActive?.toMillis() || 0;
      return bTime - aTime;
    });
  }, [tables]);

  // Set the first active table as default if available
  useEffect(() => {
    if (activeTables.length > 0 && !tableId && !isCreatingNewTable) {
      setTableId(activeTables[0].id);
    }
  }, [activeTables, tableId, isCreatingNewTable]);

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
    const trimmedTable = tableId.trim().toLowerCase();
    if (trimmedName && trimmedTable) {
      try {
        localStorage.setItem(PLAYER_NAME_KEY, trimmedName);
      } catch (e) {
        console.error("Could not set item in localStorage.", e);
      }
      router.push(`/player?table=${encodeURIComponent(trimmedTable)}&name=${encodeURIComponent(trimmedName)}`);
    }
  };
  
  const handleDealerJoin = () => {
    const targetTable = isCreatingNewTable ? newTableId.trim().toLowerCase() : tableId.trim().toLowerCase();
    if (targetTable) {
      router.push(`/dealer?table=${encodeURIComponent(targetTable)}`);
    }
  };

  const handleResumeSession = () => {
    const trimmedTable = tableId.trim().toLowerCase();
    if (savedPlayerName && trimmedTable) {
      router.push(`/player?table=${encodeURIComponent(trimmedTable)}&name=${encodeURIComponent(savedPlayerName)}`);
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

  const handleDealerTableSelect = (val: string) => {
    if (val === "__CREATE_NEW__") {
      setIsCreatingNewTable(true);
      setNewTableId("");
    } else {
      setIsCreatingNewTable(false);
      setTableId(val);
    }
  };

  if (savedPlayerName) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-primary-foreground/80">
          Welcome back, <strong className="font-bold text-accent">{savedPlayerName}</strong>!
        </p>
        <div className="space-y-2 text-left">
          <Label htmlFor="resume-table" className="text-primary-foreground">Select Poker Table</Label>
          {isTablesLoading ? (
            <p className="text-sm text-primary-foreground/60">Loading tables...</p>
          ) : activeTables.length === 0 ? (
            <p className="text-sm text-destructive font-semibold">No active tables found.</p>
          ) : (
            <Select onValueChange={(val) => setTableId(val)} value={tableId}>
              <SelectTrigger className="bg-background/80 text-foreground">
                <SelectValue placeholder="Choose a table..." />
              </SelectTrigger>
              <SelectContent>
                {activeTables.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    Table: {t.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button onClick={handleResumeSession} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!tableId}>
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
            <Label className="text-primary-foreground">Select Poker Table</Label>
            {isTablesLoading ? (
              <p className="text-sm text-primary-foreground/60">Loading tables...</p>
            ) : activeTables.length === 0 ? (
              <div className="rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-center">
                <p className="text-xs text-destructive font-semibold">No active tables found. Ask the dealer to create one.</p>
              </div>
            ) : (
              <Select onValueChange={(val) => setTableId(val)} value={tableId}>
                <SelectTrigger className="bg-background/80 text-foreground">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select an active table..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {activeTables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      Table: {t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

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

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!playerName.trim() || !tableId}>
            Join Game
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="dealer" className="mt-4 space-y-4">
         <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-primary-foreground font-medium">Select or Create Table</Label>
              <Select onValueChange={handleDealerTableSelect} value={isCreatingNewTable ? "__CREATE_NEW__" : tableId}>
                <SelectTrigger className="bg-background/80 text-foreground">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select table or create new..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {activeTables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      Join Table: {t.id}
                    </SelectItem>
                  ))}
                  <SelectItem value="__CREATE_NEW__" className="text-primary font-semibold flex items-center gap-1">
                    + Create New Table...
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCreatingNewTable && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label htmlFor="newTableId" className="text-primary-foreground font-semibold text-accent">New Table Name</Label>
                <Input
                  id="newTableId"
                  placeholder="e.g. table-alpha, omega"
                  value={newTableId}
                  onChange={(e) => setNewTableId(e.target.value)}
                  className="bg-background/80 text-foreground"
                  required
                />
              </div>
            )}

            <p className="text-sm text-primary-foreground/80 text-center">
                Proceed to the password-protected dashboard to manage the game.
            </p>
            
            <Button 
              onClick={handleDealerJoin} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
              disabled={isCreatingNewTable ? !newTableId.trim() : !tableId}
            >
                Enter as Dealer
            </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
