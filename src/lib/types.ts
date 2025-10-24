
import { Timestamp } from "firebase/firestore";

export type Player = {
  id: string;
  name: string;
  rebuys: number;
  blackCoins: number;
  createdAt: Timestamp;
};
