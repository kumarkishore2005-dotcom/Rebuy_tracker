
import { Timestamp } from "firebase/firestore";

export type Player = {
  id: string;
  name: string;
  blackCoins: number;
  createdAt: Timestamp;
  rebuyTimestamps: Timestamp[];
  hasPendingRebuyRequest: boolean;
};
