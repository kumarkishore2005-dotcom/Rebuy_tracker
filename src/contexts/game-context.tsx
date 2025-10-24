
'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useState,
} from 'react';
import type { Player } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEY = 'rebuy-tracker-game-state';

// --- Reducer Actions ---
type Action =
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'DELETE_PLAYER'; payload: { playerId: string } }
  | { type: 'ADD_REBUY'; payload: { playerId: string } }
  | { type: 'REMOVE_REBUY'; payload: { playerId: string } }
  | { type: 'UPDATE_BLACK_COINS'; payload: { playerId: string; count: number } }
  | { type: 'SET_STATE'; payload: GameState };

// --- State ---
interface GameState {
  players: Player[];
  isLoading: boolean;
}

const initialState: GameState = {
  players: [],
  isLoading: true,
};

// --- Reducer ---
const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'SET_STATE':
        return {
            ...state,
            players: action.payload.players,
            isLoading: action.payload.isLoading,
        };
    case 'ADD_PLAYER':
      const newPlayer: Player = {
        id: uuidv4(),
        name: action.payload.name,
        rebuys: 1,
        blackCoins: 0,
      };
      return { ...state, players: [...state.players, newPlayer] };
    case 'DELETE_PLAYER':
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.payload.playerId),
      };
    case 'ADD_REBUY':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId ? { ...p, rebuys: p.rebuys + 1 } : p
        ),
      };
    case 'REMOVE_REBUY':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId && p.rebuys > 1
            ? { ...p, rebuys: p.rebuys - 1 }
            : p
        ),
      };
    case 'UPDATE_BLACK_COINS':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.payload.playerId
            ? { ...p, blackCoins: action.payload.count }
            : p
        ),
      };
    default:
      return state;
  }
};

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
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { toast } = useToast();

  // Effect to load state from localStorage on initial mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      const payload = savedState ? JSON.parse(savedState) : { players: [] };
      dispatch({ type: 'SET_STATE', payload: { ...payload, isLoading: false } });
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      dispatch({ type: 'SET_STATE', payload: { ...initialState, isLoading: false } });
    }
  }, []);

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    try {
      if(!state.isLoading) {
        const stateToSave = { players: state.players };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
      }
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [state.players, state.isLoading]);

  // Effect to listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
            try {
                // Prevent infinite loop by checking if the new value is different
                if (event.newValue === JSON.stringify({ players: state.players })) {
                    return;
                }
                const newState = JSON.parse(event.newValue);
                dispatch({ type: 'SET_STATE', payload: { ...newState, isLoading: false } });
            } catch (error) {
                console.error("Failed to parse state from storage event", error);
            }
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [state.players]); 

  const addPlayer = useCallback(
    (name: string) => {
      if (state.players.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
        toast({
          title: 'Player already exists',
          description: `${name} is already at the table.`,
          variant: 'destructive',
        });
        return;
      }
      dispatch({ type: 'ADD_PLAYER', payload: { name } });
      toast({
        title: 'Player Joined',
        description: `${name} has joined the table with 1 buy-in.`,
      });
    },
    [state.players, toast]
  );

  const deletePlayer = useCallback(
    (playerId: string) => {
      const player = state.players.find((p) => p.id === playerId);
      if(player) {
        dispatch({ type: 'DELETE_PLAYER', payload: { playerId } });
        toast({
          title: 'Player Removed',
          description: `${player.name} has been removed from the table.`,
          variant: 'destructive',
        });
      }
    },
    [state.players, toast]
  );

  const addRebuy = useCallback(
    (playerId: string) => {
      const player = state.players.find((p) => p.id === playerId);
      if(player) {
          dispatch({ type: 'ADD_REBUY', payload: { playerId } });
          toast({
              title: 'Re-buy Added',
              description: `${player.name} has re-bought.`,
          });
      }
    },
    [state.players, toast]
  );

  const removeRebuy = useCallback(
    (playerId: string) => {
        const player = state.players.find((p) => p.id === playerId);
        if (player) {
            if (player.rebuys <= 1) {
                toast({
                  title: 'Action Not Allowed',
                  description: 'Cannot remove the initial buy-in.',
                  variant: 'destructive',
                });
                return;
            }
            dispatch({ type: 'REMOVE_REBUY', payload: { playerId } });
            toast({
                title: 'Re-buy Removed',
                description: `A re-buy was removed for ${player.name}.`,
                variant: 'destructive',
              });
        }
    },
    [state.players, toast]
  );

  const getPlayerByName = useCallback(
    (name: string): Player | undefined => {
      return state.players.find((p) => p.name.toLowerCase() === name.toLowerCase());
    },
    [state.players]
  );

  const updateBlackCoins = useCallback((playerId: string, count: number) => {
    const validCount = count >= 0 ? count : 0;
    dispatch({ type: 'UPDATE_BLACK_COINS', payload: { playerId, count: validCount } });
  }, []);

  const value = useMemo(
    () => ({
      players: state.players,
      isLoading: state.isLoading,
      addPlayer,
      deletePlayer,
      addRebuy,
      removeRebuy,
      getPlayerByName,
      updateBlackCoins,
    }),
    [
      state.players,
      state.isLoading,
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
