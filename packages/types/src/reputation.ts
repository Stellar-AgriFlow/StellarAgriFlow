export type ActivityType =
  | 'TradeCompleted'
  | 'FinancingCompleted'
  | 'RepaymentCompleted'
  | 'EscrowCompleted';

export interface ReputationRecord {
  user: string;
  successfulTrades: number;
  completedFinancing: number;
  successfulRepayments: number;
  completedEscrows: number;
  reputationScore: number;
  trustTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  updatedAt: number;
}
