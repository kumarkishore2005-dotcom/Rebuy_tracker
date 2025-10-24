
'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type { Player } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEY = 'rebuy-tracker-game-state';

// --- Context ---
interface GameContextType {
  players: Player[];
  isLoading: boolean;
  addPlayer: (name: string) => void;
  deletePlayer: (playerId: string) => void;
  addRebuy: (playerId: string) => void;
  removeRebuy: (playerId: string) => void;
  getPlayerByName: (name: string) => Player | undefined;
  updateBlackCoins: (playerId: string, count: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// --- Provider ---
export function GameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Unified function to update state and localStorage
  const setGameState = useCallback((newPlayers: Player[]) => {
    setPlayers(newPlayers);
    try {
        // Only write to localStorage if in the browser
        if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ players: newPlayers }));
        }
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, []);
  
  // Effect to load state from localStorage on initial mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setPlayers(parsedState.players || []);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
    setIsLoading(false);
  }, []);

  // Effect to listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          // Directly update the state from the storage event to re-render
          setPlayers(newState.players || []);
        } catch (error) {
          console.error("Failed to parse state from storage event", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array ensures this runs only once

  const addPlayer = useCallback(
    (name: string) => {
      const currentPlayers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{"players":[]}')?.players || [];
      if (currentPlayers.find((p: Player) => p.name.toLowerCase() === name.toLowerCase())) {
        toast({
          title: 'Player already exists',
          description: `${name} is already at the table.`,
          variant: 'destructive',
        });
        return;
      }
      const newPlayer: Player = {
        id: uuidv4(),
        name,
        rebuys: 1,
        blackCoins: 0,
      };
      setGameState([...currentPlayers, newPlayer]);
      toast({
        title: 'Player Joined',
        description: `${name} has joined the table with 1 buy-in.`,
      });
    },
    [setGameState, toast]
  );

  const deletePlayer = useCallback(
    (playerId: string) => {
        const currentPlayers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{"players":[]}')?.players || [];
        const player = currentPlayers.find((p: Player) => p.id === playerId);
      if(player) {
        setGameState(currentPlayers.filter((p: Player) => p.id !== playerId));
        toast({
          title: 'Player Removed',
          description: `${player.name} has been removed from the table.`,
          variant: 'destructive',
        });
      }
    },
    [setGameState, toast]
  );

  const addRebuy = useCallback(
    (playerId: string) => {
        const currentPlayers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{"players":[]}')?.players || [];
        const player = currentPlayers.find((p: Player) => p.id === playerId);
      if(player) {
          const newPlayers = currentPlayers.map((p: Player) =>
            p.id === playerId ? { ...p, rebuys: p.rebuys + 1 } : p
          );
          setGameState(newPlayers);
          toast({
              title: 'Re-buy Added',
              description: `${player.name} has re-bought.`,
          });
      }
    },
    [setGameState, toast]
  );

  const removeRebuy = useCallback(
    (playerId: string) => {
        const currentPlayers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{"players":[]}')?.players || [];
        const player = currentPlayers.find((p: Player) => p.id === playerId);
        if (player) {
            if (player.rebuys <= 1) {
                toast({
                  title: 'Action Not Allowed',
                  description: 'Cannot remove the initial buy-in.',
                  variant: 'destructive',
                });
                return;
            }
            const newPlayers = currentPlayers.map((p: Player) =>
              p.id === playerId ? { ...p, rebuys: p.rebuys - 1 } : p
            );
            setGameState(newPlayers);
            toast({
                title: 'Re-buy Removed',
                description: `A re-buy was removed for ${player.name}.`,
                variant: 'destructive',
              });
        }
    },
    [setGameState, toast]
  );

  const getPlayerByName = useCallback(
    (name: string): Player | undefined => {
      return players.find((p) => p.name.toLowerCase() === name.toLowerCase());
    },
    [players]
  );

  const updateBlackCoins = useCallback((playerId: string, count: number) => {
    const currentPlayers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{"players":[]}')?.players || [];
    const validCount = count >= 0 ? count : 0;
    const newPlayers = currentPlayers.map((p: Player) =>
        p.id === playerId ? { ...p, blackCoins: validCount } : p
    );
    setGameState(newPlayers);
  }, [setGameState]);

  const value = useMemo(
    () => ({
      players,
      isLoading,
      addPlayer,
      deletePlayer,
      addRebuy,
      removeRebuy,
      getPlayerByName,
      updateBlackCoins,
    }),
    [
      players,
      isLoading,
      addPlayer,
      deletePlayer,
      addRebuy,
      removeRebuy,
      getPlayerByName,
      updateBlackCoins,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// --- Hook ---
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
