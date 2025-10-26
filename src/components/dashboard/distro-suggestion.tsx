
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Shuffle } from 'lucide-react';
import { calculateSettlement, type Transaction } from '@/lib/settlement';
import type { Player } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DistroSuggestionProps {
  players: Player[];
}

export function DistroSuggestion({ players }: DistroSuggestionProps) {
  const transactions = useMemo(() => calculateSettlement(players), [players]);
  const totalBuyIns = players.reduce((total, player) => total + (player.rebuys ?? 0), 0);
  const totalBlackCoins = players.reduce((total, player) => total + (player.blackCoins ?? 0), 0);
  const isBalanced = totalBuyIns === totalBlackCoins;


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle />
          Distro Suggestion
        </CardTitle>
        <CardDescription>
          The most efficient way for players to settle their balances.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
