
"use client";

import { useMemo } from "react";
import { useGame } from "@/contexts/game-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MinusCircle, PlusCircle, Trash2, User, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { ConfirmationDialog } from "../shared/confirmation-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

interface PlayerListProps {
  isDealer?: boolean;
  highlightPlayerName?: string;
}

function PlayerListSkeleton() {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="text-center">Buy-ins</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-6 w-8 mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  
function RebuyTooltip({ timestamps }: { timestamps: Timestamp[] }) {
    if (!timestamps || timestamps.length === 0) {
      return null;
    }
    
    // Sort timestamps just in case, oldest first
    const sortedTimestamps = [...timestamps].sort((a, b) => a.toMillis() - b.toMillis());
  
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center justify-center gap-1 cursor-help">
              {timestamps.length}
              <Info className="h-3 w-3 text-muted-foreground" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="p-2 text-sm">
              <p className="font-bold mb-2 border-b pb-1">Buy-in History</p>
              <ul className="space-y-1">
                {sortedTimestamps.map((ts, index) => (
                  <li key={index} className="text-xs">
                    <span className="font-semibold">{index === 0 ? 'Buy-in:' : `Re-buy #${index}:`}</span>
                    <span className="ml-2">{format(ts.toDate(), "h:mm a")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

export function PlayerList({ isDealer = false, highlightPlayerName }: PlayerListProps) {
  const { players, addRebuy, removeRebuy, deletePlayer, updateBlackCoins, isLoading } = useGame();

  const sortedPlayers = useMemo(() => {
    // Memoizing the sorted list is crucial to prevent re-render issues with real-time data
    return [...players].sort((a, b) => (b.rebuys ?? 0) - (a.rebuys ?? 0));
  }, [players]);

  if (isLoading) {
    return <PlayerListSkeleton />;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead className="text-center">Buy-ins</TableHead>
            {isDealer && <TableHead className="text-center">#Black coins</TableHead>}
            {isDealer && <TableHead className="text-center">End Count</TableHead>}
            {isDealer && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.length > 0 ? (
            sortedPlayers
              .map((player) => (
                <TableRow key={player.id} className={cn(player.name === highlightPlayerName && "bg-accent/50")}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        {player.name === highlightPlayerName && <User className="h-4 w-4 text-primary" />}
                        <span>{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-lg font-bold">
                    <RebuyTooltip timestamps={player.rebuyTimestamps} />
                  </TableCell>
                  {isDealer && (
                    <>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          className="w-20 mx-auto"
                          value={player.blackCoins}
                          onChange={(e) => updateBlackCoins(player.id, parseInt(e.target.value, 10) || 0)}
                          min={0}
                        />
                      </TableCell>
                      <TableCell className="text-center text-lg font-bold">
                        {player.blackCoins - (player.rebuys ?? 0)}
                      </TableCell>
                    </>
                  )}
                  {isDealer && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRebuy(player.id)}
                          aria-label={`Remove re-buy for ${player.name}`}
                          disabled={(player.rebuys ?? 0) <= 1}
                        >
                          <MinusCircle className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => addRebuy(player.id)}
                          aria-label={`Add re-buy for ${player.name}`}
                        >
                          <PlusCircle className="h-5 w-5 text-green-600" />
                        </Button>
                        <ConfirmationDialog
                          title="Delete Player?"
                          description={`Are you sure you want to delete ${player.name}? This action cannot be undone.`}
                          onConfirm={() => deletePlayer(player.id)}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${player.name}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </ConfirmationDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
          ) : (
            <TableRow>
              <TableCell colSpan={isDealer ? 5 : 2} className="h-24 text-center">
                No players at the table yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
