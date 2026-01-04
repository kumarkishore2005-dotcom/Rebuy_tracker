"use client";

import { useGame } from "@/contexts/game-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Banknote, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

const BUYIN_VALUE = 20; // Assuming each buy-in is $20

export function Totals() {
    const { players } = useGame();
    const totalBuyIns = players.reduce((total, player) => total + (player.rebuyTimestamps?.length ?? 0), 0);
    const totalBlackCoins = players.reduce((total, player) => total + (player.blackCoins ?? 0), 0);
    const totalsMatch = totalBuyIns === totalBlackCoins;
    const totalPot = totalBuyIns * BUYIN_VALUE;

    return (
        <Card className={cn("transition-colors lg:col-span-2", !totalsMatch && "bg-destructive/10 border-destructive")}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Landmark />
                    Game Totals
                </CardTitle>
                <CardDescription>
                    {totalsMatch 
                        ? "The pot is balanced. Ready for settlement." 
                        : "Totals are unbalanced. Chip counts do not match buy-ins."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            Total Buy-ins
                        </div>
                        <p className={cn("text-4xl font-bold transition-colors", !totalsMatch && "text-destructive")}>{totalBuyIns.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Pot</p>
                        <p className={cn("text-4xl font-bold transition-colors", !totalsMatch && "text-destructive")}>${totalPot.toFixed(2)}</p>
                    </div>
                </div>
                <Separator />
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Banknote className="h-4 w-4" />
                        Total Black Coins (to Bank)
                    </div>
                    <p className={cn("text-4xl font-bold transition-colors", !totalsMatch && "text-destructive")}>{totalBlackCoins.toFixed(2)}</p>
                </div>
            </CardContent>
        </Card>
    );
}
