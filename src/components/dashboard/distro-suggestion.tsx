
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Shuffle, User, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateSettlement, type Transaction } from '@/lib/settlement';
import type { Player } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface DistroSuggestionProps {
  players: Player[];
}

function PlayerBalances({ players }: { players: Player[] }) {
    const balances = useMemo(() => {
        return players.map(p => ({
            id: p.id,
            name: p.name,
            balance: p.blackCoins - (p.rebuys ?? 0)
        })).sort((a,b) => b.balance - a.balance);
    }, [players]);

    return (
        <div className="space-y-2">
             <h4 className="text-sm font-medium text-muted-foreground">Final Counts</h4>
            <ul className="space-y-2">
                {balances.map(p => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {p.name}
                        </span>
                        <span className={cn(
                            "font-bold",
                            p.balance > 0 && "text-green-600",
                            p.balance < 0 && "text-destructive",
                        )}>
                            {p.balance > 0 && "+"}{p.balance}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}


export function DistroSuggestion({ players }: DistroSuggestionProps) {
  const transactions = useMemo(() => calculateSettlement(players), [players]);
  const totalBuyIns = players.reduce((total, player) => total + (player.rebuys ?? 0), 0);
  const totalBlackCoins = players.reduce((total, player) => total + (player.blackCoins ?? 0), 0);
  const isBalanced = totalBuyIns === totalBlackCoins && totalBuyIns > 0;


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle />
          Settlement
        </CardTitle>
        <CardDescription>
          Final player balances and efficient payment suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <PlayerBalances players={players} />

        <Separator />
        
        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Payouts</h4>
            {!isBalanced ? (
                <div className="flex flex-col items-center justify-center text-center p-4 bg-destructive/10 rounded-lg h-full">
                    <p className="text-sm font-semibold text-destructive">Totals Don't Match</p>
                    <p className="text-xs text-destructive/80 mt-1">Player balances cannot be calculated until the total buy-ins match the total black coins on the table.</p>
                </div>
            ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center text-center p-4 bg-muted/50 rounded-lg h-full">
                <p className="text-sm text-muted-foreground">All players are settled. No payments needed.</p>
            </div>
            ) : (
            <ul className="space-y-3">
                {transactions.map((tx, index) => (
                <li
                    key={index}
                    className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md"
                >
                    <span className="font-semibold text-destructive">{tx.from}</span>
                    <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg">${tx.amount}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-semibold text-green-600">{tx.to}</span>
                </li>
                ))}
            </ul>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
