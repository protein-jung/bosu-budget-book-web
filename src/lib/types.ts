export type TransactionType = 'INCOME' | 'EXPENSE';
export type CardType = 'CREDIT' | 'DEBIT' | 'CASH';
export type HouseholdRole = 'OWNER' | 'MEMBER';

export type Category = {
  id: number;
  name: string;
  type: TransactionType;
  color: string | null;
};

export type CardAccount = {
  id: number;
  name: string;
  type: CardType;
  ownerUserId: number | null;
  ownerName: string | null;
};

export type Member = {
  userId: number;
  name: string;
  email: string;
  role: HouseholdRole;
};

export type Household = {
  id: number;
  name: string;
  inviteCode: string;
  members: Member[];
};

export type Transaction = {
  id: number;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string | null;
  cardId: number | null;
  cardName: string | null;
  userId: number;
  userName: string;
  memo: string | null;
};

export type CategoryStat = {
  categoryId: number;
  categoryName: string;
  color: string | null;
  type: TransactionType;
  amount: number;
};

export type CardStat = {
  cardId: number;
  cardName: string;
  amount: number;
};

export type MemberStat = {
  userId: number;
  userName: string;
  income: number;
  expense: number;
};

export type MonthlySummary = {
  totalIncome: number;
  totalExpense: number;
  byCategory: CategoryStat[];
  byCard: CardStat[];
  byMember: MemberStat[];
};
