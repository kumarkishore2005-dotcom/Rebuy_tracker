
'use client';
import React, { createContext, useContext, useMemo, useCallback, ReactNode, useEffect, useState } from 'react';
import { useFirestore, useCollection, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { collection, doc, Timestamp, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Log, Player } from '@/lib/types';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';

export interface GameContextType {
  players: Player[];
  logs: Log[];
  isLoading: boolean;
  addPlayer: (name: string) => void;
  findOrCreatePlayer: (name: string) => void;
  deletePlayer: (id: string) => void;
  deleteAllPlayersAndLogs: () => void;
  addRebuy: (id: string) => void;
  removeRebuy: (id: string) => void;
  updateBlackCoins: (id: string, count: number) => void;
  getPlayerByName: (name: string) => Player | undefined;
  requestRebuy: (id: string) => void;
  approveRebuy: (id: string) => void;
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
  
  const logsColRef = useMemo(() => {
    if (!firestore || !isClient) return null;
    return collection(firestore, 'logs');
  }, [firestore, isClient]);

  const { data: playersFromHook, isLoading: isPlayersLoading } = useCollection<Omit<Player, 'rebuys'>>(playersColRef);
  const { data: logs, isLoading: isLogsLoading } = useCollection<Log>(logsColRef);

  const players = useMemo(() => {
    return playersFromHook?.map(p => ({
        ...p,
        rebuys: p.rebuyTimestamps?.length || 0,
    })) || [];
  }, [playersFromHook]);

  const logAction = useCallback((message: string) => {
    if (!logsColRef) return;
    const newLog: Omit<Log, 'id'> = {
        message,
        createdAt: Timestamp.now(),
    };
    addDocumentNonBlocking(logsColRef, newLog);
  }, [logsColRef]);

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
      const now = Timestamp.now();
      const newPlayer: Omit<Player, 'id' | 'rebuys' | 'createdAt'> & { createdAt: Timestamp } = {
        name,
        rebuyTimestamps: [now],
        blackCoins: 0,
        createdAt: now,
        hasPendingRebuyRequest: false,
      };
      addDocumentNonBlocking(playersColRef, newPlayer);
      logAction(`Player ${name} joined the game.`);
      toast({
        title: 'Player Added',
        description: `${name} has joined the game.`,
      });
    },
    [firestore, playersColRef, getPlayerByName, toast, logAction]
  );
  
  const findOrCreatePlayer = useCallback((name: string) => {
    if (!firestore || !playersColRef || isPlayersLoading) return;
    
    const existingPlayer = getPlayerByName(name);
    
    if (!existingPlayer) {
        const now = Timestamp.now();
        const newPlayer: Omit<Player, 'id'| 'rebuys' | 'createdAt'> & { createdAt: Timestamp } = {
            name,
            rebuyTimestamps: [now],
            blackCoins: 0,
            createdAt: now,
            hasPendingRebuyRequest: false,
        };
        addDocumentNonBlocking(playersColRef, newPlayer);
        logAction(`Player ${name} joined the game.`);
        console.log(`Player ${name} created.`);
    } else {
        console.log(`Player ${name} already exists.`);
    }

  }, [firestore, playersColRef, isPlayersLoading, getPlayerByName, logAction]);


  const deletePlayer = useCallback(
    (id: string) => {
      if (!firestore) return;
      const playerDocRef = doc(firestore, 'players', id);
      const player = players?.find(p => p.id === id);
      deleteDocumentNonBlocking(playerDocRef);
      if (player) {
        logAction(`Player ${player.name} was removed.`);
        toast({
          title: 'Player Removed',
          description: `${player.name} has been removed from the game.`,
          variant: 'destructive',
        });
      }
    },
    [firestore, players, toast, logAction]
  );

  const deleteAllPlayersAndLogs = useCallback(async () => {
    if (!firestore) return;

    const batch = writeBatch(firestore);

    players.forEach(player => {
        const playerDocRef = doc(firestore, 'players', player.id);
        batch.delete(playerDocRef);
    });

    logs?.forEach(log => {
        const logDocRef = doc(firestore, 'logs', log.id);
        batch.delete(logDocRef);
    });
    
    await batch.commit();

    logAction('Game has been reset.');
    toast({
        title: 'Game Reset',
        description: 'All players and logs have been removed.',
        variant: 'destructive',
    });
  }, [firestore, players, logs, toast, logAction]);

  const addRebuy = useCallback(
    (id: string) => {
      if (!firestore) return;
      const player = players?.find(p => p.id === id);
      if (player) {
        const playerDocRef = doc(firestore, 'players', id);
        updateDocumentNonBlocking(playerDocRef, { 
            rebuyTimestamps: arrayUnion(Timestamp.now()),
            hasPendingRebuyRequest: false 
        });
        logAction(`Re-buy approved for ${player.name}.`);
        toast({
          title: 'Rebuy Added',
          description: `Rebuy confirmed for ${player.name}.`,
        });
      }
    },
    [firestore, players, toast, logAction]
  );

  const requestRebuy = useCallback((id: string) => {
    if (!firestore) return;
    const player = players?.find(p => p.id === id);
    if (player) {
        const playerDocRef = doc(firestore, 'players', id);
        updateDocumentNonBlocking(playerDocRef, { hasPendingRebuyRequest: true });
        logAction(`Re-buy requested by ${player.name}.`);
        toast({
            title: 'Request Sent',
            description: 'Your rebuy request has been sent to the dealer.',
        });
    }
  }, [firestore, toast, players, logAction]);
  
  const approveRebuy = useCallback((id: string) => {
    if (!firestore) return;
    const player = players?.find(p => p.id === id);
    if (player) {
        addRebuy(id);
    }
  }, [firestore, players, addRebuy]);

  const removeRebuy = useCallback(
    (id: string) => {
      if (!firestore) return;
      const player = players?.find(p => p.id === id);
      if (player && player.rebuyTimestamps && player.rebuyTimestamps.length > 0) {
        if (player.rebuyTimestamps.length <= 1) {
          toast({
            title: 'Action Not Allowed',
            description: 'Cannot remove the initial buy-in.',
            variant: 'destructive',
          });
          return;
        }
        // To remove the last rebuy, we unfortunately have to provide the exact Timestamp object.
        const lastRebuy = player.rebuyTimestamps[player.rebuyTimestamps.length - 1];
        const playerDocRef = doc(firestore, 'players', id);
        updateDocumentNonBlocking(playerDocRef, { rebuyTimestamps: arrayRemove(lastRebuy) });
        logAction(`Last re-buy removed for ${player.name}.`);
        toast({
          title: 'Rebuy Removed',
          description: `Removed the last rebuy for ${player.name}.`,
          variant: 'destructive',
        });
      }
    },
    [firestore, players, toast, logAction]
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
      players: players || [],
      logs: logs || [],
      isLoading: isPlayersLoading || isLogsLoading || !isClient,
      addPlayer,
      findOrCreatePlayer,
      deletePlayer,
      deleteAllPlayersAndLogs,
      addRebuy,
      removeRebuy,
      updateBlackCoins,
      getPlayerByName,
      requestRebuy,
      approveRebuy,
    }),
    [
      players,
      logs,
      isPlayersLoading,
      isLogsLoading,
      isClient,
      addPlayer,
      findOrCreatePlayer,
      deletePlayer,
      deleteAllPlayersAndLogs,
      addRebuy,
      removeRebuy,
      updateBlackCoins,
      getPlayerByName,
      requestRebuy,
      approveRebuy,
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
