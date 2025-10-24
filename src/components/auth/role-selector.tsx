
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, UserCog } from "lucide-react";

export function RoleSelector() {
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();

  const handlePlayerJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      router.push(`/dashboard?role=player&name=${encodeURIComponent(playerName.trim())}`);
    }
  };
  
  const handleDealerSelect = () => {
    router.push('/dashboard?role=dealer');
  };

  return (
    <Tabs defaultValue="player" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-primary/20">
        <TabsTrigger value="player" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <User className="mr-2 h-4 w-4" /> Player
        </TabsTrigger>
        <TabsTrigger value="dealer" onClick={handleDealerSelect} className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <UserCog className="mr-2 h-4 w-4" /> Dealer
        </TabsTrigger>
      </TabsList>
      <TabsContent value="player" className="mt-4">
        <form onSubmit={handlePlayerJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-primary-foreground">Player Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
              className="bg-background/80 text-foreground"
            />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!playerName.trim()}>
            Join Game
          </Button>
        </form>
      </TabsContent>
      <TabsContent value="dealer" className="mt-4">
         <div className="text-center text-primary-foreground/80">
            <p>You have selected the Dealer role.</p>
            <Button onClick={handleDealerSelect} className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                Proceed to Dealer Dashboard
            </Button>
         </div>
      </TabsContent>
    </Tabs>
  );
}
