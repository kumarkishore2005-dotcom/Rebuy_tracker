
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
  lastUpdated: string | null;
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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Unified function to update state and localStorage
  const setGameState = useCallback((newPlayers: Player[] | ((prevState: Player[]) => Player[])) => {
    const timestamp = new Date().toISOString();
    setLastUpdated(timestamp);

    setPlayers(prevState => {
        const updatedPlayers = typeof newPlayers === 'function' ? newPlayers(prevState) : newPlayers;
        try {
          if (typeof window !== 'undefined') {
            const stateToSave = {
                players: updatedPlayers,
                lastUpdated: timestamp,
            }
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
          }
        } catch (error) {
          console.error('Failed to save state to localStorage', error);
        }
        return updatedPlayers;
    });
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setPlayers(parsedState.players || []);
        setLastUpdated(parsedState.lastUpdated || null);
      }
    } catch (error) {
      console.error('Failed to load state from localStorage', error);
      setPlayers([]);
      setLastUpdated(null);
    }
    setIsLoading(false);
  }, []);

  // Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          const localState = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localState && event.newValue !== localState) {
            if (newState && newState.players) {
              setPlayers(newState.players);
              setLastUpdated(newState.lastUpdated || null);
            }
          }
        } catch (error) {
            console.error("Failed to parse state from storage event", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addPlayer = useCallback(
    (name: string) => {
        setGameState(currentPlayers => {
            if (currentPlayers.find((p: Player) => p.name.toLowerCase() === name.toLowerCase())) {
                toast({
                  title: 'Player already exists',
                  description: `${name} is already at the table.`,
                  variant: 'destructive',
                });
                return currentPlayers;
            }
            const newPlayer: Player = {
                id: uuidv4(),
                name,
                rebuys: 1,
                blackCoins: 0,
            };
            toast({
                title: 'Player Joined',
                description: `${name} has joined the table with 1 buy-in.`,
            });
            return [...currentPlayers, newPlayer];
        });
    },
    [setGameState, toast]
  );

  const deletePlayer = useCallback(
    (playerId: string) => {
        setGameState(currentPlayers => {
            const player = currentPlayers.find((p: Player) => p.id === playerId);
            if(player) {
              toast({
                title: 'Player Removed',
                description: `${player.name} has been removed from the table.`,
                variant: 'destructive',
              });
              return currentPlayers.filter((p: Player) => p.id !== playerId);
            }
            return currentPlayers;
        });
    },
    [setGameState, toast]
  );

  const addRebuy = useCallback(
    (playerId: string) => {
        setGameState(currentPlayers => {
            const player = currentPlayers.find((p: Player) => p.id === playerId);
            if(player) {
                toast({
                    title: 'Re-buy Added',
                    description: `${player.name} has re-bought.`,
                });
                return currentPlayers.map((p: Player) =>
                    p.id === playerId ? { ...p, rebuys: p.rebuys + 1 } : p
                );
            }
            return currentPlayers;
        });
    },
    [setGameState, toast]
  );

  const removeRebuy = useCallback(
    (playerId: string) => {
        setGameState(currentPlayers => {
            const player = currentPlayers.find((p: Player) => p.id === playerId);
            if (player) {
                if (player.rebuys <= 1) {
                    toast({
                      title: 'Action Not Allowed',
                      description: 'Cannot remove the initial buy-in.',
                      variant: 'destructive',
                    });
                    return currentPlayers;
                }
                toast({
                    title: 'Re-buy Removed',
                    description: `A re-buy was removed for ${player.name}.`,
                    variant: 'destructive',
                });
                return currentPlayers.map((p: Player) =>
                  p.id === playerId ? { ...p, rebuys: Math.max(1, p.rebuys - 1) } : p
                );
            }
            return currentPlayers;
        });
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
    setGameState(currentPlayers => {
        const validCount = Math.max(0, count);
        return currentPlayers.map((p: Player) =>
            p.id === playerId ? { ...p, blackCoins: validCount } : p
        );
    });
  }, [setGameState]);

  const value = useMemo(
    () => ({
      players,
      lastUpdated,
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
      lastUpdated,
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
