'use client';
import React, { createContext, useContext, useMemo, useCallback, ReactNode, useEffect, useState } from 'react';
import { useFirestore, useCollection, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Player } from '@/lib/types';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';

export interface GameContextType {
  players: Player[];
  isLoading: boolean;
  addPlayer: (name: string) => void;
  deletePlayer: (id: string) => void;
  deleteAllPlayers: () => void;
  addRebuy: (id: string) => void;
  removeRebuy: (id: string) => void;
  updateBlackCoins: (id: string, count: number) => void;
  getPlayerByName: (name: string) => Player | undefined;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (auth) {
        initiateAnonymousSignIn(auth);
    }
  }, [auth]);

  const playersColRef = useMemo(() => {
    if (!firestore || !isClient) return null;
    return collection(firestore, 'players');
  }, [firestore, isClient]);

  const { data: players, isLoading: isPlayersLoading } = useCollection<Omit<Player, 'id'>>(playersColRef);

  const getPlayerByName = useCallback(
    (name: string) => {
      return players?.find(p => p.name.toLowerCase() === name.toLowerCase());
    },
    [players]
  );

  const addPlayer = useCallback(
    (name: string) => {
      if (!firestore || !playersColRef) return;
      if (getPlayerByName(name)) {
        toast({
          title: 'Player already exists',
          description: `${name} is already at the table.`,
          variant: 'destructive',
        });
        return;
      }
      const newPlayer: Omit<Player, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
        name,
        rebuys: 1,
        blackCoins: 0,
        createdAt: Timestamp.now(),
      };
      addDocumentNonBlocking(playersColRef, newPlayer);
      toast({
        title: 'Player Added',
        description: `${name} has joined the game.`,
      });
    },
    [firestore, playersColRef, getPlayerByName, toast]
  );

  const deletePlayer = useCallback(
    (id: string) => {
      if (!firestore) return;
      const playerDocRef = doc(firestore, 'players', id);
      const player = players?.find(p => p.id === id);
      deleteDocumentNonBlocking(playerDocRef);
      if (player) {
        toast({
          title: 'Player Removed',
          description: `${player.name} has been removed from the game.`,
          variant: 'destructive',
        });
      }
    },
    [firestore, players, toast]
  );

  const deleteAllPlayers = useCallback(() => {
    if (!firestore || !players) return;
    players.forEach(player => {
        const playerDocRef = doc(firestore, 'players', player.id);
        deleteDocumentNonBlocking(playerDocRef);
    });
    toast({
        title: 'Game Reset',
        description: 'All players have been removed from the table.',
        variant: 'destructive',
    });
  }, [firestore, players, toast]);

  const addRebuy = useCallback(
    (id: string) => {
      if (!firestore) return;
      const player = players?.find(p => p.id === id);
      if (player) {
        const playerDocRef = doc(firestore, 'players', id);
        updateDocumentNonBlocking(playerDocRef, { rebuys: player.rebuys + 1 });
        toast({
          title: 'Rebuy Added',
          description: `Rebuy confirmed for ${player.name}.`,
        });
      }
    },
    [firestore, players, toast]
  );

  const removeRebuy = useCallback(
    (id: string) => {
      if (!firestore) return;
      const player = players?.find(p => p.id === id);
      if (player) {
        if (player.rebuys <= 1) {
          toast({
            title: 'Action Not Allowed',
            description: 'Cannot remove the initial buy-in.',
            variant: 'destructive',
          });
          return;
        }
        const playerDocRef = doc(firestore, 'players', id);
        updateDocumentNonBlocking(playerDocRef, { rebuys: player.rebuys - 1 });
        toast({
          title: 'Rebuy Removed',
          description: `Removed a rebuy for ${player.name}.`,
          variant: 'destructive',
        });
      }
    },
    [firestore, players, toast]
  );

  const updateBlackCoins = useCallback(
    (id: string, count: number) => {
      if (!firestore) return;
      const playerDocRef = doc(firestore, 'players', id);
      updateDocumentNonBlocking(playerDocRef, { blackCoins: Math.max(0, count) });
    },
    [firestore]
  );

  const value = useMemo(
    () => ({
      // Perform a deep copy to ensure components receive a fresh array of new objects
      players: players ? JSON.parse(JSON.stringify(players)) : [],
      isLoading: isPlayersLoading || !isClient,
      addPlayer,
      deletePlayer,
      deleteAllPlayers,
      addRebuy,
      removeRebuy,
      updateBlackCoins,
      getPlayerByName,
    }),
    [
      players,
      isPlayersLoading,
      isClient,
      addPlayer,
      deletePlayer,
      deleteAllPlayers,
      addRebuy,
      removeRebuy,
      updateBlackCoins,
      getPlayerByName,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
