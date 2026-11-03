export interface InsurancePolicyRecord {
  policyId: number;
  farmer: string;
  region: string;
  triggerDroughtIndex: number;
  payoutAmountXlm: number;
  premiumPaidXlm: number;
  isPaid: boolean;
  isExpired: boolean;
  durationDays: number;
  createdAt: number;
}

export interface PurchasePolicyParams {
  farmer: string;
  region: string;
  triggerDroughtIndex: number;
  payoutAmountXlm: number;
  durationDays: number;
}

export interface LiquidityPoolStatus {
  totalLiquidityXlm: number;
  totalShares: number;
  userShares?: number;
}
