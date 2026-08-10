export type TransactionType = 'INCOME' | 'EXPENSE';
export type ImportProvider = 'SAMSUNG_CARD' | 'GYEONGGI_LOCAL_CURRENCY';
export type CardType = 'CREDIT' | 'DEBIT' | 'CASH';
export type HouseholdRole = 'OWNER' | 'MEMBER';

export type Category = {
  id: number;
  name: string;
  type: TransactionType;
  color: string | null;
  icon: string | null;
  parentId: number | null;
  sortOrder: number;
  targetAmount: number | null;
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
  categoryIcon: string | null;
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
  icon: string | null;
  type: TransactionType;
  amount: number;
  parentId: number | null;
  parentName: string | null;
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

export type ImportCategoryBreakdown = {
  categoryId: number;
  categoryName: string;
  count: number;
  amount: number;
};

export type ImportResult = {
  importedCount: number;
  skippedCount: number;
  totalAmount: number;
  cardId: number;
  cardName: string;
  categoryBreakdown: ImportCategoryBreakdown[];
};

export type CategoryBudget = {
  categoryId: number;
  categoryName: string;
  color: string | null;
  icon: string | null;
  type: TransactionType;
  targetAmount: number;
  spentAmount: number;
  monthOverride: boolean;
};

export type MonthlySummary = {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  byCategory: CategoryStat[];
  byParentCategory: CategoryStat[];
  byCard: CardStat[];
  byMember: MemberStat[];
  budgets: CategoryBudget[];
};

export type MonthlyTrendPoint = {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  byCategory: CategoryStat[];
  byParentCategory: CategoryStat[];
};

export type RangeSummary = {
  months: MonthlyTrendPoint[];
};

export type AssetType = 'REAL_ESTATE' | 'VEHICLE' | 'STOCK' | 'CRYPTO' | 'CASH' | 'OTHER';

export type Asset = {
  id: number;
  type: AssetType;
  name: string;
  custodian: string | null;
  symbol: string | null;
  quantity: number | null;
  manualValue: number | null;
  currentPrice: number | null;
  priceUpdatedAt: string | null;
  currentValue: number | null;
  memo: string | null;
  address: string | null;
  dong: string | null;
  ho: string | null;
};

export type AssetTypeBreakdown = { type: AssetType; amount: number };
export type AssetCustodianBreakdown = { custodian: string; amount: number };

export type AssetSummary = {
  totalValue: number;
  byType: AssetTypeBreakdown[];
  byCustodian: AssetCustodianBreakdown[];
};

export type AssetRefreshResult = {
  updatedCount: number;
  failedCount: number;
  assets: Asset[];
};

export type SigunguOption = { name: string; code: string };
export type RealEstateRegion = { sido: string; sigunguList: SigunguOption[] };

export type AddressCandidate = {
  roadAddress: string | null;
  jibunAddress: string | null;
  lawdCd: string;
  dongName: string;
  buildingName: string | null;
};

export type RealEstateTrade = {
  aptName: string | null;
  dong: string | null;
  buildingDong: string | null;
  jibun: string | null;
  exclusiveArea: number | null;
  floor: number | null;
  dealDate: string | null;
  dealAmount: number;
};
