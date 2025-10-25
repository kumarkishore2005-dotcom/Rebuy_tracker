
import { Timestamp } from "firebase/firestore";

export type Player = {
  id: string;
  name: string;
  rebuys: number; // This will be derived from rebuyTimestamps.length
  blackCoins: number;
  createdAt: Timestamp;
  rebuyTimestamps: Timestamp[];
  hasPendingRebuyRequest: boolean;
};

export type Log = {
  id: string;
  message: string;
  createdAt: Timestamp;
};
