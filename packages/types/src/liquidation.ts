export type AuctionStatus = 'Active' | 'Filled' | 'Expired' | 'Cancelled';

export interface CollateralAuction {
  id: number;
  borrower: string;
  receiptId: number;
  debtAmount: number;
  startPrice: number;
  reservePrice: number;
  startTime: number;
  durationSeconds: number;
  status: AuctionStatus;
  buyer?: string;
  finalPrice: number;
}

export interface StartAuctionParams {
  caller: string;
  borrower: string;
  receiptId: number;
  debtAmount: number;
  startPrice: number;
  reservePrice: number;
  durationSeconds: number;
}

export interface BuyCollateralParams {
  buyer: string;
  auctionId: number;
  paymentAmount: number;
}
