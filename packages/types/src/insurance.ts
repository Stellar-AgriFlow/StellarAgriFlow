export type RiskType = 'Drought' | 'ExcessRain' | 'Freeze' | 'Flood';

export interface ParametricPolicy {
  id: number;
  farmer: string;
  cropType?: string;
  riskType: RiskType;
  payoutAmountUsd: number;
  premiumAmountUsd: number;
  status: 'Active' | 'PaidOut' | 'Expired';
  startTime?: number;
  expirationTime: number;
  triggerThreshold: number;
  coverageAmount?: number;
  premium?: number;
  currentOracleValue?: number;
}

export interface CreatePolicyParams {
  farmer: string;
  cropType?: string;
  riskType: RiskType;
  triggerThreshold: number;
  payoutAmountUsd: number;
  durationDays: number;
}

export interface DepositCapitalParams {
  funder: string;
  amountUsd: number;
}

export interface WithdrawCapitalParams {
  funder: string;
  sharesToBurn: number;
}

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
  totalDeposited: number;
  totalReserved: number;
  totalShares: number;
  userShares?: number;
  totalLiquidityXlm?: number;
}
