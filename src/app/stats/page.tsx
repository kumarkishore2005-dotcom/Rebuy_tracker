'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerStat {
  id: string;
  name: string;
  gamesPlayed: number;
  totalBuyIns: number;
  totalProfit: number;
}

export default function StatsPage() {
  const { firestore } = useFirebase();
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!firestore) return;
      try {
        const q = query(collection(firestore, 'playerStats'), orderBy('totalProfit', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PlayerStat[];
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [firestore]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Hall of Fame
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historical Player Stats</CardTitle>
            <CardDescription>All-time records for tracked players.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : stats.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No stats recorded yet. Finalize a game with Tom to see records here!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-t-lg">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-lg">Player</th>
                      <th className="px-6 py-4">Games Played</th>
                      <th className="px-6 py-4">Total Buy-ins</th>
                      <th className="px-6 py-4 rounded-tr-lg">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((stat, i) => (
                      <tr key={stat.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-base flex items-center gap-2">
                            {i === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                            {stat.name}
                        </td>
                        <td className="px-6 py-4">{stat.gamesPlayed}</td>
                        <td className="px-6 py-4">{stat.totalBuyIns}</td>
                        <td className={cn(
                          "px-6 py-4 font-bold text-base",
                          stat.totalProfit > 0 ? "text-green-600" : stat.totalProfit < 0 ? "text-destructive" : ""
                        )}>
                          {stat.totalProfit > 0 ? "+" : ""}{Number(stat.totalProfit).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
