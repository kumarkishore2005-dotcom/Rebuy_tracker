'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import type { Player } from '@/lib/types';

const LOCAL_STORAGE_KEY = 'rebuy-tracker-game-state';

interface GameState {
  players: Player[];
  lastUpdated: string | null;
}

interface GameContextType {
  players: Player[];
  lastUpdated: string | null;
  isLoading: boolean;
  addPlayer: (name: string) => void;
  deletePlayer: (id: string) => void;
  addRebuy: (id: string) => void;
  removeRebuy: (id: string) => void;
  updateBlackCoins: (id: string, count: number) => void;
  getPlayerByName: (name: string) => Player | undefined;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({ players: [], lastUpdated: null });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) setGameState(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync state across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
        try {
          setGameState(JSON.parse(event.newValue));
        } catch (e) {
          console.error('Failed to parse state from storage event', e);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Persist state to localStorage
  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const addPlayer = useCallback((name: string) => {
    updateState(prev => {
      if (prev.players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        toast({ title: 'Player exists', description: `${name} already joined`, variant: 'destructive' });
        return prev;
      }
      const newPlayer: Player = { id: uuidv4(), name, rebuys: 1, blackCoins: 0 };
      toast({ title: 'Player Added', description: `${name} joined` });
      return { players: [...prev.players, newPlayer], lastUpdated: new Date().toISOString() };
    });
  }, [updateState, toast]);

  const deletePlayer = useCallback((id: string) => {
    updateState(prev => {
      const player = prev.players.find(p => p.id === id);
      if (player) toast({ title: 'Player Removed', description: player.name, variant: 'destructive' });
      return { players: prev.players.filter(p => p.id !== id), lastUpdated: new Date().toISOString() };
    });
  }, [updateState, toast]);

  const addRebuy = useCallback((id: string) => {
    let playerName = '';
    updateState(prev => {
        const newPlayers = prev.players.map(p => {
            if (p.id === id) {
                playerName = p.name;
                return { ...p, rebuys: p.rebuys + 1 };
            }
            return p;
        });
        return {
            players: newPlayers,
            lastUpdated: new Date().toISOString(),
        };
    });
    if (playerName) {
        toast({ title: 'Rebuy Added', description: `For ${playerName}` });
    }
  }, [updateState, toast]);

  const removeRebuy = useCallback((id: string) => {
    updateState(prev => {
        let playerCanRemove = false;
        const player = prev.players.find(p => p.id === id);
        if (player && player.rebuys <= 1) {
            toast({
                title: 'Action Not Allowed',
                description: 'Cannot remove the initial buy-in.',
                variant: 'destructive',
            });
        } else {
            playerCanRemove = true;
        }

        if(playerCanRemove) {
            if (player) toast({ title: 'Rebuy Removed', description: `For ${player.name}`, variant: 'destructive' });
            return {
                players: prev.players.map(p => {
                    if (p.id === id) return { ...p, rebuys: p.rebuys - 1 };
                    return p;
                }),
                lastUpdated: new Date().toISOString(),
            }
        }
        return prev;
    });
  }, [updateState, toast]);

  const updateBlackCoins = useCallback((id: string, count: number) => {
    updateState(prev => ({
      players: prev.players.map(p => p.id === id ? { ...p, blackCoins: Math.max(0, count) } : p),
      lastUpdated: new Date().toISOString(),
    }));
  }, [updateState]);

  const getPlayerByName = useCallback((name: string) => {
    return gameState.players.find(p => p.name.toLowerCase() === name.toLowerCase());
  }, [gameState.players]);

  const value = useMemo(() => ({
    players: gameState.players,
    lastUpdated: gameState.lastUpdated,
    isLoading,
    addPlayer,
    deletePlayer,
    addRebuy,
    removeRebuy,
    updateBlackCoins,
    getPlayerByName,
  }), [gameState, isLoading, addPlayer, deletePlayer, addRebuy, removeRebuy, updateBlackCoins, getPlayerByName]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be inside GameProvider');
  return context;
}
