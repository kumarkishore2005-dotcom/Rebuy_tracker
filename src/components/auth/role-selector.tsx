
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, UserCog } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";

export function RoleSelector() {
  const [playerName, setPlayerName] = useState("");
  const [dealerEmail, setDealerEmail] = useState("test@test.com");
  const [dealerPassword, setDealerPassword] = useState("test1234");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handlePlayerJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      router.push(`/dashboard?role=player&name=${encodeURIComponent(playerName.trim())}`);
    }
  };
  
  const handleDealerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Authentication service not available",
        description: "Please try again later.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, dealerEmail, dealerPassword);
      router.push('/dashboard?role=dealer');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user doesn't exist, create it
        try {
          await createUserWithEmailAndPassword(auth, dealerEmail, dealerPassword);
          router.push('/dashboard?role=dealer');
        } catch (createError: any) {
          toast({
            variant: "destructive",
            title: "Error creating account",
            description: createError.message,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error.message,
        });
      }
    } finally {
        setIsSubmitting(false);
    }
  };

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
         <form onSubmit={handleDealerLogin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-primary-foreground">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="dealer@example.com"
                value={dealerEmail}
                onChange={(e) => setDealerEmail(e.target.value)}
                required
                className="bg-background/80 text-foreground"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password" className="text-primary-foreground">Password</Label>
                <Input
                id="password"
                type="password"
                value={dealerPassword}
                onChange={(e) => setDealerPassword(e.target.value)}
                required
                className="bg-background/80 text-foreground"
                />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || !auth}>
                {isSubmitting ? 'Logging in...' : 'Login as Dealer'}
            </Button>
            <p className="text-xs text-center text-primary-foreground/60">
                Use test@test.com / test1234 or your own credentials. An account will be created if it doesn't exist.
            </p>
        </form>
      </TabsContent>
    </Tabs>
  );
}
