export type ListingStatus = 'Active' | 'Sold' | 'Cancelled';

export interface ProduceListing {
  listingId: number;
  seller: string;
  farmId: string;
  cropType: string;
  quantity: number;
  unit: string; // e.g. 'kg', 'metric tons', 'bags'
  pricePerUnitXlm: number;
  totalPriceXlm: number;
  location: string;
  status: ListingStatus;
  escrowId?: number;
  createdAt: number;
  soldAt?: number;
  txHash?: string;
}

export interface CreateListingParams {
  seller: string;
  farmId: string;
  cropType: string;
  quantity: number;
  unit: string;
  pricePerUnitXlm: number;
  location: string;
}

export interface PurchaseListingParams {
  listingId: number;
  buyer: string;
  quantity: number;
}
