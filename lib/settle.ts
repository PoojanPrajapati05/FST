/**
 * SplitEase Debt Settlement & Balance Engine
 * 
 * All monetary amounts are handled strictly as INTEGER PAISE (1 INR = 100 paise)
 * to avoid floating-point rounding errors.
 * 
 * Net Balance Invariant:
 * For any closed group: sum(netBalances) === 0
 * 
 * Greedy Debt Simplification Algorithm:
 * 1. Computes net balances:
 *    balance = totalPaidForExpenses + totalSettlementsPaid - totalExpenseShares - totalSettlementsReceived
 * 2. Partitions users into Debtors (balance < 0) and Creditors (balance > 0).
 * 3. Greedily pairs the largest Debtor with the largest Creditor:
 *    settleAmount = min(|debtor.balance|, creditor.balance)
 * 4. Yields the minimum number of settle-up transactions (at most N - 1 edges).
 * 
 * Unit Test Examples in Comments:
 * 
 * Example 1 (Simple 2-person split):
 * Alice pays ₹100 (10,000 paise) for lunch with Bob (5,000 paise each).
 * Net: Alice: +5000, Bob: -5000
 * Simplified transactions:
 * -> Bob pays Alice ₹50 (5,000 paise).
 * 
 * Example 2 (Circular debt simplification):
 * Alice paid ₹300 for Bob, Bob paid ₹300 for Charlie, Charlie paid ₹300 for Alice.
 * Net: Alice: 0, Bob: 0, Charlie: 0
 * Simplified transactions: None (0 transactions needed).
 * 
 * Example 3 (Multi-person trip):
 * Alice paid ₹600 for {Alice, Bob, Charlie} (₹200 each).
 * Bob paid ₹300 for {Alice, Bob, Charlie} (₹100 each).
 * Balances:
 * Alice: +600 - 300 = +300
 * Bob:   +300 - 300 = 0
 * Charlie:  0 - 300 = -300
 * Result:
 * -> Charlie pays Alice ₹300. (Bob owes nothing and is owed nothing).
 */

export interface UserBalance {
  userId: string;
  userName: string;
  userEmail: string;
  totalPaid: number;      // in paise
  totalOwed: number;      // in paise
  netBalance: number;     // in paise (positive = owed to user, negative = owes to group)
}

export interface SimplifiedTransaction {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;         // in paise
}

export interface RawGroupMember {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RawExpense {
  paidById: string;
  amount: number;
  shares: {
    userId: string;
    amount: number;
  }[];
}

export interface RawSettlement {
  payerId: string;
  receiverId: string;
  amount: number;
}

/**
 * Computes exact net balances for all members in a group.
 */
export function calculateGroupBalances(
  members: RawGroupMember[],
  expenses: RawExpense[],
  settlements: RawSettlement[]
): Map<string, UserBalance> {
  const balanceMap = new Map<string, UserBalance>();

  // Initialize all members
  for (const m of members) {
    balanceMap.set(m.user.id, {
      userId: m.user.id,
      userName: m.user.name,
      userEmail: m.user.email,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0,
    });
  }

  // 1. Process Expenses
  for (const expense of expenses) {
    const payer = balanceMap.get(expense.paidById);
    if (payer) {
      payer.totalPaid += expense.amount;
      payer.netBalance += expense.amount;
    }

    for (const share of expense.shares) {
      const participant = balanceMap.get(share.userId);
      if (participant) {
        participant.totalOwed += share.amount;
        participant.netBalance -= share.amount;
      }
    }
  }

  // 2. Process Settlements
  for (const st of settlements) {
    const payer = balanceMap.get(st.payerId);
    if (payer) {
      // Payer settled part of debt -> increases payer's net balance towards zero
      payer.totalPaid += st.amount;
      payer.netBalance += st.amount;
    }

    const receiver = balanceMap.get(st.receiverId);
    if (receiver) {
      // Receiver collected debt -> decreases receiver's net balance towards zero
      receiver.totalOwed += st.amount;
      receiver.netBalance -= st.amount;
    }
  }

  return balanceMap;
}

/**
 * Greedily simplifies debts to minimize the total number of transactions.
 */
export function simplifyDebts(balanceMap: Map<string, UserBalance>): SimplifiedTransaction[] {
  const debtors: { userId: string; userName: string; debt: number }[] = [];
  const creditors: { userId: string; userName: string; credit: number }[] = [];

  for (const user of balanceMap.values()) {
    if (user.netBalance < -1) {
      // User owes money (allow 1 paisa tolerance for rounding)
      debtors.push({
        userId: user.userId,
        userName: user.userName,
        debt: -user.netBalance,
      });
    } else if (user.netBalance > 1) {
      // User is owed money
      creditors.push({
        userId: user.userId,
        userName: user.userName,
        credit: user.netBalance,
      });
    }
  }

  const transactions: SimplifiedTransaction[] = [];

  // Greedy loop: match largest debtor with largest creditor
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort descending by amount
    debtors.sort((a, b) => b.debt - a.debt);
    creditors.sort((a, b) => b.credit - a.credit);

    const largestDebtor = debtors[0];
    const largestCreditor = creditors[0];

    const settledAmount = Math.min(largestDebtor.debt, largestCreditor.credit);

    if (settledAmount > 0) {
      transactions.push({
        fromUserId: largestDebtor.userId,
        fromUserName: largestDebtor.userName,
        toUserId: largestCreditor.userId,
        toUserName: largestCreditor.userName,
        amount: settledAmount,
      });
    }

    largestDebtor.debt -= settledAmount;
    largestCreditor.credit -= settledAmount;

    if (largestDebtor.debt <= 1) {
      debtors.shift();
    }
    if (largestCreditor.credit <= 1) {
      creditors.shift();
    }
  }

  return transactions;
}

/**
 * Helper to format paise into Indian Rupee representation (e.g. 50000 paise -> "₹500.00")
 */
export function formatPaiseToINR(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = (absPaise / 100).toFixed(2);
  const parts = rupees.split(".");
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Format Indian commas: last 3 digits, then pairs of 2 digits (e.g., 1,00,000.00)
  if (integerPart.length > 3) {
    const last3 = integerPart.substring(integerPart.length - 3);
    const otherDigits = integerPart.substring(0, integerPart.length - 3);
    integerPart = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }

  return `${isNegative ? "-" : ""}₹${integerPart}.${decimalPart}`;
}
