export type ProtocolEventType =
  | 'FarmRegistered'
  | 'FinancingRequested'
  | 'FinancingFunded'
  | 'RepaymentRecorded'
  | 'FinancingClosed'
  | 'ListingCreated'
  | 'ListingPurchased'
  | 'EscrowCreated'
  | 'EscrowFunded'
  | 'EscrowReleased'
  | 'EscrowRefunded'
  | 'ReputationUpdated'
  | 'AgriculturalPayment';

export interface IndexedProtocolEvent {
  id: string;
  eventType: ProtocolEventType;
  contractId?: string;
  ledger: number;
  txHash: string;
  timestamp: number;
  data: Record<string, any>;
  primaryWallet?: string;
  farmId?: string;
}

export interface EventFilterCriteria {
  eventType?: ProtocolEventType;
  wallet?: string;
  farmId?: string;
  contractId?: string;
  limit?: number;
}
