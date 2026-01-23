
import { Timestamp } from "firebase/firestore";

export type Player = {
  id: string;
  name: string;
  blackCoins: number;
  createdAt: Timestamp;
  rebuyTimestamps: Timestamp[];
  hasPendingRebuyRequest: boolean;
};

export type Table = {
  id: string;
  name: string;
  createdAt: Timestamp;
  playerCount?: number; // Optional: can be computed on the client
};
