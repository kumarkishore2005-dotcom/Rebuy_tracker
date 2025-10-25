'use client';
import React, { createContext, useContext, useMemo, useCallback, ReactNode, useEffect, useState } from 'react';
import { useFirestore, useCollection, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { collection, doc, Timestamp, arrayUnion, arrayRemove, writeBatch, getDocs, query, setDoc, addDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Player } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PlayerCountToast } from '@/components/dashboard/player-count-toast';


export interface GameContextType {
  players: Player[];
  isLoading: boolean;
  addPlayer: (name: string) => void;
  findOrCreatePlayer: (name: string) => void;
  deletePlayer: (id: string) => void;
  deleteAllPlayers: () => void;
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
  const [showPlayerCount, setShowPlayerCount] = useState(false);

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

  const { data: playersFromHook, isLoading: isPlayersLoading } = useCollection<Omit<Player, 'rebuys'>>(playersColRef);
  
  const players = useMemo(() => {
    return playersFromHook?.map(p => ({
        ...p,
        rebuys: p.rebuyTimestamps?.length || 0,
    })) || [];
  }, [playersFromHook]);


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

      addDoc(playersColRef, newPlayer).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: playersColRef.path,
            operation: 'create',
            requestResourceData: newPlayer,
        }));
      });

      toast({
        title: 'Player Added',
        description: `${name} has joined the game.`,
      });
    },
    [firestore, playersColRef, getPlayerByName, toast]
  );
  
  const findOrCreatePlayer = useCallback(async (name: string) => {
    if (!firestore || !playersColRef) return;
    
    const q = query(playersColRef, where("name", "==", name));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const now = Timestamp.now();
        const newPlayer: Omit<Player, 'id'| 'rebuys' | 'createdAt'> & { createdAt: Timestamp } = {
            name,
            rebuyTimestamps: [now],
            blackCoins: 0,
            createdAt: now,
            hasPendingRebuyRequest: false,
        };
        addDoc(playersColRef, newPlayer).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: playersColRef.path,
                operation: 'create',
                requestResourceData: newPlayer,
            }));
        });
        console.log(`Player ${name} created.`);
    } else {
        console.log(`Player ${name} already exists.`);
    }

  }, [firestore, playersColRef]);


  const deletePlayer = useCallback(
    (id: string) => {
      if (!firestore) return;
      const playerDocRef = doc(firestore, 'players', id);
      const player = players?.find(p => p.id === id);

      deleteDoc(playerDocRef).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: playerDocRef.path,
            operation: 'delete',
        }));
      });

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

  const deleteAllPlayers = useCallback(async () => {
    if (!firestore || !playersColRef) return;

    try {
        const batch = writeBatch(firestore);
        const q = query(playersColRef);
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        toast({
            title: 'Game Reset',
            description: 'All players have been removed.',
            variant: 'destructive',
        });
    } catch(serverError) {
        // This is a complex operation, so we just signal the attempt
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: playersColRef.path,
            operation: 'delete', // Batch delete can be simplified to a collection-level delete op
        }));
    }
  }, [firestore, playersColRef, toast]);


  const addRebuy = useCallback(
    (id: string) => {
      if (!firestore) return;
      const player = players?.find(p => p.id === id);
      if (player) {
        const playerDocRef = doc(firestore, 'players', id);
        const updateData = { 
            rebuyTimestamps: arrayUnion(Timestamp.now()),
            hasPendingRebuyRequest: false 
        };
        updateDoc(playerDocRef, updateData).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: playerDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
            }));
        });
        toast({
          title: 'Rebuy Confirmed',
          description: `A rebuy was added for ${player.name}.`,
        });
      }
    },
    [firestore, players, toast]
  );

  const requestRebuy = useCallback((id: string) => {
    if (!firestore) return;
    const player = players?.find(p => p.id === id);
    if (player) {
        const playerDocRef = doc(firestore, 'players', id);
        const updateData = { hasPendingRebuyRequest: true };
        updateDoc(playerDocRef, updateData).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: playerDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
            }));
        });
        toast({
            title: 'Request Sent',
            description: 'Your rebuy request has been sent to the dealer for approval.',
        });
    }
  }, [firestore, toast, players]);
  
  const approveRebuy = useCallback((id: string) => {
    if (!firestore) return;
    const player = players?.find(p => p.id === id);
    if (player) {
      const playerDocRef = doc(firestore, 'players', id);
      const updateData = { 
          rebuyTimestamps: arrayUnion(Timestamp.now()),
          hasPendingRebuyRequest: false 
      };
      updateDoc(playerDocRef, updateData).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: playerDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        }));
      });
      toast({
        title: 'Rebuy Approved!',
        description: `Your rebuy for ${player.name} has been approved.`,
      });
    }
  }, [firestore, players, toast]);

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
        const lastRebuy = player.rebuyTimestamps[player.rebuyTimestamps.length - 1];
        const playerDocRef = doc(firestore, 'players', id);
        const updateData = { rebuyTimestamps: arrayRemove(lastRebuy) };
        updateDoc(playerDocRef, updateData).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: playerDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
            }));
        });
        toast({
          title: 'Rebuy Removed',
          description: `Removed the last rebuy for ${player.name}.`,
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
      const updateData = { blackCoins: Math.max(0, count) };
      setDoc(playerDocRef, updateData, { merge: true }).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: playerDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        }));
      });
    },
    [firestore]
  );

  const value = useMemo(
    () => ({
      players: players || [],
      isLoading: isPlayersLoading || !isClient,
      addPlayer,
      findOrCreatePlayer,
      deletePlayer,
      deleteAllPlayers,
      addRebuy,
      removeRebuy,
      updateBlackCoins,
      getPlayerByName,
      requestRebuy,
      approveRebuy,
    }),
    [
      players,
      isPlayersLoading,
      isClient,
      addPlayer,
      findOrCreatePlayer,
      deletePlayer,
      deleteAllPlayers,
      addRebuy,
      removeRebuy,
      updateBlackCoins,
      getPlayerByName,
      requestRebuy,
      approveRebuy,
    ]
  );

  return (
    <GameContext.Provider value={value}>
        {children}
        {showPlayerCount && <PlayerCountToast onDismiss={() => setShowPlayerCount(false)} />}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
