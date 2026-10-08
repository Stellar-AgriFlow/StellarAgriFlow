export type EscrowStatus =
  | 'Created'
  | 'Funded'
  | 'Released'
  | 'Refunded'
  | 'Disputed';

export interface EscrowRecord {
  escrowId: number;
  buyer: string;
  seller: string;
  listingId: number;
  amount: string;
  amountXlm: number;
  asset: string;
  status: EscrowStatus;
  createdAt: number;
  fundedAt?: number;
  releasedAt?: number;
  refundedAt?: number;
  txHash?: string;
}

export interface CreateEscrowParams {
  buyer: string;
  seller: string;
  listingId: number;
  amountXlm: number;
  asset?: string;
}

export interface ReleaseEscrowParams {
  escrowId: number;
  buyer: string;
}

export interface RefundEscrowParams {
  escrowId: number;
  caller: string;
  reason?: string;
}
