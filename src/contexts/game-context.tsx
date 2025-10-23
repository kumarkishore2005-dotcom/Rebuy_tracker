'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import type { Player } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface GameContextType {
  players: Player[];
  isLoading: boolean;
  addPlayer: (name: string) => void;
  addRebuy: (playerId: string) => void;
  removeRebuy: (playerId: string) => void;
  getPlayerByName: (name: string) => Player | undefined;
  updateBlackCoins: (playerId: string, count: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const playersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'players') : null),
    [firestore]
  );

  const { data: players, isLoading } = useCollection<Player>(playersCollection);

  const addPlayer = useCallback(
    (name: string) => {
      if (!playersCollection) return;

      const existingPlayer = players?.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (existingPlayer) {
        toast({
          title: 'Player already exists',
          description: `${name} is already at the table.`,
          variant: 'destructive',
        });
        return;
      }

      const newPlayer: Omit<Player, 'id'> = {
        name,
        rebuys: 1,
        blackCoins: 0,
      };
      addDoc(playersCollection, newPlayer)
        .then(() => {
          toast({
            title: 'Player Joined',
            description: `${name} has joined the table with 1 buy-in.`,
          });
        })
        .catch(() => {
            const contextualError = new FirestorePermissionError({
                operation: 'create',
                path: playersCollection.path,
                requestResourceData: newPlayer,
            });
            errorEmitter.emit('permission-error', contextualError);
        });
    },
    [players, playersCollection, toast]
  );

  const addRebuy = useCallback(
    (playerId: string) => {
      if (!firestore) return;
      const playerDocRef = doc(firestore, 'players', playerId);
      const player = players?.find((p) => p.id === playerId);

      if (!player) return;

      updateDoc(playerDocRef, { rebuys: player.rebuys + 1 })
        .then(() => {
          toast({
            title: 'Re-buy Added',
            description: `${player.name} has re-bought.`,
          });
        })
        .catch(() => {
            const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: playerDocRef.path,
                requestResourceData: { rebuys: player.rebuys + 1 },
            });
            errorEmitter.emit('permission-error', contextualError);
        });
    },
    [firestore, players, toast]
  );

  const removeRebuy = useCallback(
    (playerId: string) => {
      if (!firestore) return;
      const playerDocRef = doc(firestore, 'players', playerId);
      const player = players?.find((p) => p.id === playerId);

      if (!player) return;

      if (player.rebuys > 1) {
        updateDoc(playerDocRef, { rebuys: player.rebuys - 1 })
          .then(() => {
            toast({
              title: 'Re-buy Removed',
              description: `A re-buy was removed for ${player.name}.`,
              variant: 'destructive',
            });
          })
          .catch(() => {
            const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: playerDocRef.path,
                requestResourceData: { rebuys: player.rebuys - 1 },
            });
            errorEmitter.emit('permission-error', contextualError);
        });
      } else {
        toast({
          title: 'Action Not Allowed',
          description: 'Cannot remove the initial buy-in.',
          variant: 'destructive',
        });
      }
    },
    [firestore, players, toast]
  );

  const getPlayerByName = useCallback(
    (name: string): Player | undefined => {
      return players?.find((p) => p.name.toLowerCase() === name.toLowerCase());
    },
    [players]
  );

  const updateBlackCoins = useCallback(
    (playerId: string, count: number) => {
      if (!firestore) return;
      const validCount = count >= 0 ? count : 0;
      const playerDocRef = doc(firestore, 'players', playerId);
      updateDoc(playerDocRef, { blackCoins: validCount }).catch(() => {
        const contextualError = new FirestorePermissionError({
            operation: 'update',
            path: playerDocRef.path,
            requestResourceData: { blackCoins: validCount },
        });
        errorEmitter.emit('permission-error', contextualError);
      });
    },
    [firestore]
  );

  const value = useMemo(
    () => ({
      players: players || [],
      isLoading,
      addPlayer,
      addRebuy,
      removeRebuy,
      getPlayerByName,
      updateBlackCoins,
    }),
    [
      players,
      isLoading,
      addPlayer,
      addRebuy,
      removeRebuy,
      getPlayerByName,
      updateBlackCoins,
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
