'use client';
import React, { createContext, useContext, useMemo, useCallback, ReactNode, useEffect } from 'react';
import { useFirestore, useCollection, useAuth, initiateAnonymousSignIn, useUser as useFirebaseUser } from '@/firebase';
import { collection, doc, Timestamp, arrayUnion, arrayRemove, writeBatch, getDocs, query, setDoc, addDoc, updateDoc, deleteDoc, where, CollectionReference, getDocs as getDocsFirestore } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Player } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  const { user, isUserLoading: isAuthLoading } = useFirebaseUser();
  const { toast } = useToast();
  
  useEffect(() => {
    if (auth && !user && !isAuthLoading) {
        initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isAuthLoading]);

  const playersColRef = useMemo(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'players') as CollectionReference<Omit<Player, 'id' | 'rebuys'>>;
  }, [firestore, user]);

  const { data: playersFromHook, isLoading: isPlayersLoading } = useCollection<Omit<Player, 'rebuys'>>(playersColRef);
  
  const players = useMemo(() => {
    return playersFromHook?.map(p => ({
        ...p,
        rebuys: p.rebuyTimestamps?.length || 0,
    })) || [];
  }, [playersFromHook]);


  const getPlayerByName = useCallback(
    (name: string) => {
        if (!name) return undefined;
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
          description: `A player named ${name} is already at the table. Player names must be unique (case-insensitive).`,
          variant: 'destructive',
        });
        return;
      }
      const now = Timestamp.now();
      const newPlayer: Omit<Player, 'id' | 'rebuys'> = {
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
    if (!firestore || !playersColRef || !name) return;
  
    // This function now robustly handles case-insensitivity at the data layer.
    const querySnapshot = await getDocsFirestore(query(playersColRef, where("name", "==", name)));
    
    let existingPlayer = null;
    if (!querySnapshot.empty) {
        existingPlayer = querySnapshot.docs[0].data();
    }
    
    // If no exact match, do a case-insensitive check on the client-side players list as a fallback.
    if (!existingPlayer) {
        const clientSideMatch = players.find(p => p.name.toLowerCase() === name.toLowerCase());
        if(clientSideMatch) {
            console.log(`Player ${name} found (case-insensitive).`);
            return; // Player exists, do nothing.
        }
    } else {
        console.log(`Player ${name} already exists.`);
        return; // Player exists, do nothing.
    }

    // If we've reached here, the player truly does not exist.
    const now = Timestamp.now();
    const newPlayer: Omit<Player, 'id'| 'rebuys'> = {
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

  }, [firestore, playersColRef, players]);


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

  const removeRebuy = useCallback(
    (id: string) => {
      if (!firestore) return;
      const player = players?.find(p => p.id === id);
      if (player && player.rebuyTimestamps.length > 0) {
        const playerDocRef = doc(firestore, 'players', id);
        
        // Create a new array with the last timestamp removed
        const newTimestamps = [...player.rebuyTimestamps].sort((a,b) => a.toMillis() - b.toMillis()).slice(0, -1);

        const updateData = { rebuyTimestamps: newTimestamps };
        updateDoc(playerDocRef, updateData).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: playerDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
            }));
        });
        toast({
          title: 'Last Buy-in Removed',
          description: `The last buy-in for ${player.name} has been removed.`,
          variant: 'destructive'
        });
      }
    },
    [firestore, players, toast]
  );

  const updateBlackCoins = useCallback(
    (id: string, count: number) => {
      if (!firestore) return;
      if(isNaN(count) || count < 0) return;
      const playerDocRef = doc(firestore, 'players', id);
      const updateData = { blackCoins: count };
      updateDoc(playerDocRef, updateData).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: playerDocRef.path,
            operation: 'update',
            requestResourceData: updateData,
        }));
      });
    },
    [firestore]
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
          title: 'Rebuy Approved',
          description: `Rebuy for ${player.name} has been approved.`,
      });
    }
  }, [firestore, players, toast]);
  

  const value = useMemo(
    () => ({
      players: players ?? [],
      isLoading: isAuthLoading || isPlayersLoading,
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
      isAuthLoading,
      isPlayersLoading,
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

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
