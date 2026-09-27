
import type { Player } from './types';

export interface Balance {
  name: string;
  amount: number;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export function calculateSettlement(players: Player[]): Transaction[] {
  if (!players || players.length === 0) {
    return [];
  }

  const balances: Balance[] = players.map(player => ({
    name: player.name,
    amount: player.blackCoins - (player.rebuyTimestamps?.length ?? 0),
  }));

  const debtors = balances
    .filter(p => p.amount < 0)
    .map(p => ({ ...p, amount: -p.amount }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter(p => p.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amountToSettle = Number(Math.min(creditor.amount, debtor.amount).toFixed(2));

    if (amountToSettle > 0) {
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: amountToSettle,
      });

      creditor.amount = Number((creditor.amount - amountToSettle).toFixed(2));
      debtor.amount = Number((debtor.amount - amountToSettle).toFixed(2));
    }
    
    if (creditor.amount <= 0) {
      i++;
    }

    if (debtor.amount <= 0) {
      j++;
    }
  }

  return transactions;
}
