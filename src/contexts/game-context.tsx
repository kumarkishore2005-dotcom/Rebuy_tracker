'use client';

import React, {
    createContext,
    useContext,
    useMemo,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import {
    collection,
    doc,
    Timestamp,
    arrayUnion,
    writeBatch,
    query,
    setDoc,
    updateDoc,
    deleteDoc,
    CollectionReference,
    getDoc,
    getDocs,
} from 'firebase/firestore';
import {
    useFirebase,
    useCollection,
    initiateAnonymousSignIn,
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Player } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This context is for a SINGLE game
export interface GameContextType {
    players: Player[];
    isLoading: boolean;
    isReady: boolean;
    createPlayer: (name: string) => Promise<void>;
    deletePlayer: (id: string) => Promise<void>;
    deleteAllPlayers: () => Promise<void>;
    addRebuy: (id: string) => Promise<void>;
    removeRebuy: (id: string) => Promise<void>;
    updateBlackCoins: (id: string, count: number) => Promise<void>;
    requestRebuy: (id: string) => Promise<void>;
    approveRebuy: (id: string) => Promise<void>;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

const normalizeName = (name: string) =>
    name.trim().toLowerCase().replace(/\s+/g, ' ');

interface GameProviderProps {
    children: React.ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
    const { firestore, auth, user, isUserLoading: isAuthLoading } = useFirebase();
    const { toast } = useToast();
    const didInitAuth = useRef(false);

    useEffect(() => {
        if (didInitAuth.current) return;
        if (auth && firestore && !user && !isAuthLoading) {
            didInitAuth.current = true;
            initiateAnonymousSignIn(auth);
        }
    }, [auth, firestore, user, isAuthLoading]);

    const playersColRef = useMemo(() => {
        if (!firestore || !user) return null;
        // Points to the top-level 'players' collection
        return collection(
            firestore,
            'players'
        ) as CollectionReference<Omit<Player, 'id'>>;
    }, [firestore, user]);

    const { data: players = [], isLoading: isPlayersLoading } =
        useCollection<Player>(playersColRef);

    const createPlayer = useCallback(
        async (name: string) => {
            if (!firestore || !playersColRef || !name) return;

            try {
                const normalized = normalizeName(name);
                const playerRef = doc(playersColRef, normalized);

                const playerDoc = await getDoc(playerRef);
                if (playerDoc.exists()) {
                    return;
                }

                const now = Timestamp.now();
                const newPlayer: Omit<Player, 'id'> = {
                    name,
                    rebuyTimestamps: [now],
                    blackCoins: 0,
                    createdAt: now,
                    hasPendingRebuyRequest: false,
                };

                await setDoc(playerRef, newPlayer, { merge: false });
                toast({ title: 'Player Added', description: `${name} has joined the game.` });
            } catch (err) {
                console.error('Error creating player:', err);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `players/${normalizeName(name)}`,
                    operation: 'create',
                    requestResourceData: { name },
                }));
            }
        },
        [firestore, playersColRef, toast]
    );

    const deletePlayer = useCallback(
        async (id: string) => {
            if (!firestore || !playersColRef) return;
            try {
                const player = players.find(p => p.id === id);
                await deleteDoc(doc(playersColRef, id));
                if (player) {
                    toast({ title: 'Player Removed', description: `${player.name} has been removed from the game.` });
                }
            } catch (err) {
                console.error('Error deleting player:', err);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: doc(playersColRef, id).path,
                    operation: 'delete',
                }));
            }
        },
        [firestore, playersColRef, players, toast]
    );

    const deleteAllPlayers = useCallback(async () => {
        if (!firestore || !playersColRef) return;
        try {
            const batch = writeBatch(firestore);
            const snapshot = await getDocs(query(playersColRef));
            if (snapshot.empty) {
                toast({ title: 'No Players to Remove', description: 'The game is already empty.' });
                return;
            }
            snapshot.docs.forEach(pDoc => batch.delete(pDoc.ref));
            await batch.commit();
            toast({ title: 'Game Reset', description: 'All players have been removed from the game.', variant: 'destructive' });
        } catch (err) {
            console.error('Error deleting all players:', err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: playersColRef.path, operation: 'list' }));
        }
    }, [firestore, playersColRef, toast]);

    const updatePlayerDoc = useCallback(async (id: string, updateData: any, operationName: string) => {
        if (!firestore || !playersColRef) return;
        const playerRef = doc(playersColRef, id);
        try {
            await updateDoc(playerRef, updateData);
        } catch (err) {
            console.error(`Error during ${operationName}:`, err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: playerRef.path,
                operation: 'update',
                requestResourceData: updateData
            }));
        }
    }, [firestore, playersColRef]);

    const addRebuy = useCallback(async (id: string) => {
        const player = players.find(p => p.id === id);
        await updatePlayerDoc(id, { rebuyTimestamps: arrayUnion(Timestamp.now()) }, 'addRebuy');
        if (player) {
            toast({ title: 'Rebuy Confirmed', description: `A rebuy was added for ${player.name}.` });
        }
    }, [players, updatePlayerDoc, toast]);

    const removeRebuy = useCallback(async (id: string) => {
        const player = players.find(p => p.id === id);
        if (!player || player.rebuyTimestamps.length <= 1) return;
        const updatedTimestamps = [...player.rebuyTimestamps].sort((a, b) => a.toMillis() - b.toMillis()).slice(0, -1);
        await updatePlayerDoc(id, { rebuyTimestamps: updatedTimestamps }, 'removeRebuy');
        toast({ title: 'Last Buy-in Removed', description: `The last buy-in for ${player.name} has been removed.`, variant: 'destructive' });
    }, [players, updatePlayerDoc, toast]);

    const updateBlackCoins = useCallback(async (id: string, count: number) => {
        if (isNaN(count) || count < 0) return;
        await updatePlayerDoc(id, { blackCoins: count }, 'updateBlackCoins');
    }, [updatePlayerDoc]);

    const requestRebuy = useCallback(async (id: string) => {
        await updatePlayerDoc(id, { hasPendingRebuyRequest: true }, 'requestRebuy');
        toast({ title: 'Request Sent', description: 'Your rebuy request has been sent to the dealer for approval.' });
    }, [updatePlayerDoc, toast]);

    const approveRebuy = useCallback(async (id: string) => {
        const player = players.find(p => p.id === id);
        await updatePlayerDoc(id, {
            rebuyTimestamps: arrayUnion(Timestamp.now()),
            hasPendingRebuyRequest: false,
        }, 'approveRebuy');
        if (player) {
            toast({ title: 'Rebuy Approved', description: `Rebuy for ${player.name} has been approved.` });
        }
    }, [players, updatePlayerDoc, toast]);

    const value = useMemo<GameContextType>(
        () => ({
            players: players || [],
            isLoading: isAuthLoading || isPlayersLoading,
            isReady: !!playersColRef && !!user && !isAuthLoading,
            createPlayer,
            deletePlayer,
            deleteAllPlayers,
            addRebuy,
            removeRebuy,
            updateBlackCoins,
            requestRebuy,
            approveRebuy,
        }),
        [
            players,
            playersColRef,
            user,
            isAuthLoading,
            isPlayersLoading,
            createPlayer,
            deletePlayer,
            deleteAllPlayers,
            addRebuy,
            removeRebuy,
            updateBlackCoins,
            requestRebuy,
            approveRebuy,
        ]
    );

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return ctx;
}
