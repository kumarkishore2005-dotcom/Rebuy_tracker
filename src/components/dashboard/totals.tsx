"use client";

import { useGame } from "@/contexts/game-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

export function Totals() {
    const { players } = useGame();
    const totalBuyIns = players.reduce((total, player) => total + (player.rebuyTimestamps?.length ?? 0), 0);
    const totalBlackCoins = players.reduce((total, player) => total + (player.blackCoins ?? 0), 0);
    const totalsMatch = totalBuyIns === totalBlackCoins;

    return (
        <>
            <Card className={cn("transition-colors", !totalsMatch && "bg-destructive/10 border-destructive")}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign /> Total Buy-ins</CardTitle>
                    <CardDescription>The total number of buy-ins from all players.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className={cn("text-5xl font-bold transition-colors", !totalsMatch && "text-destructive")}>{totalBuyIns}</p>
                </CardContent>
            </Card>
             <Card className={cn("transition-colors", !totalsMatch && "bg-destructive/10 border-destructive")}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Banknote /> Total to Bank</CardTitle>
                    <CardDescription>The total of all players&apos; black coins.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className={cn("text-5xl font-bold transition-colors", !totalsMatch && "text-destructive")}>{totalBlackCoins}</p>
                </CardContent>
            </Card>
        </>
    );
}
