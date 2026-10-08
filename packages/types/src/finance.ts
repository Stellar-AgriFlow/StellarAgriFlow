export type FinancingStatus =
  | 'Requested'
  | 'Funded'
  | 'Repaid'
  | 'Defaulted'
  | 'Closed';

export interface FinancingRequest {
  requestId: number;
  farmId: string;
  farmer: string;
  requestedAmount: string; // in XLM stroops or units
  requestedAmountXlm: number;
  fundingAsset: string;
  purpose: string;
  expectedRepaymentAmount: string;
  expectedRepaymentXlm: number;
  durationDays: number;
  status: FinancingStatus;
  funder?: string;
  createdAt: number;
  fundedAt?: number;
  repaidAt?: number;
  txHash?: string;
}

export interface CreateFinancingRequestParams {
  farmId: string;
  farmer: string;
  requestedAmountXlm: number;
  purpose: string;
  durationDays: number;
  interestRatePercent?: number;
}

export interface FundFinancingParams {
  requestId: number;
  funder: string;
  amountXlm: number;
}

export interface RepayFinancingParams {
  requestId: number;
  farmer: string;
  amountXlm: number;
}
