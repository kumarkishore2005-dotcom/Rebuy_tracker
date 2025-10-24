
'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { Player } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addPlayer = useCallback(
    (name: string) => {
      const existingPlayer = players.find(
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

      const newPlayer: Player = {
        id: new Date().toISOString(), // Use a temporary unique ID
        name,
        rebuys: 1,
        blackCoins: 0,
      };

      setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);

      toast({
        title: 'Player Joined',
        description: `${name} has joined the table with 1 buy-in.`,
      });
    },
    [players, toast]
  );

  const addRebuy = useCallback(
    (playerId: string) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => {
          if (p.id === playerId) {
            toast({
              title: 'Re-buy Added',
              description: `${p.name} has re-bought.`,
            });
            return { ...p, rebuys: p.rebuys + 1 };
          }
          return p;
        })
      );
    },
    [toast]
  );

  const removeRebuy = useCallback(
    (playerId: string) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => {
          if (p.id === playerId && p.rebuys > 1) {
            toast({
              title: 'Re-buy Removed',
              description: `A re-buy was removed for ${p.name}.`,
              variant: 'destructive',
            });
            return { ...p, rebuys: p.rebuys - 1 };
          }
          if (p.id === playerId && p.rebuys <= 1) {
            toast({
              title: 'Action Not Allowed',
              description: 'Cannot remove the initial buy-in.',
              variant: 'destructive',
            });
          }
          return p;
        })
      );
    },
    [toast]
  );

  const getPlayerByName = useCallback(
    (name: string): Player | undefined => {
      return players.find((p) => p.name.toLowerCase() === name.toLowerCase());
    },
    [players]
  );

  const updateBlackCoins = useCallback((playerId: string, count: number) => {
    const validCount = count >= 0 ? count : 0;
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) =>
        p.id === playerId ? { ...p, blackCoins: validCount } : p
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      players,
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
