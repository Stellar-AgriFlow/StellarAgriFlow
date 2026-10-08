export type FarmStatus = 'Active' | 'PendingVerification' | 'Suspended';

export interface FarmPassport {
  farmId: string;
  owner: string;
  country: string;
  region: string;
  crop: string;
  farmSizeHectares: number;
  expectedYieldTons: number;
  registrationTimestamp: number;
  status: FarmStatus;
  txHash?: string;
  explorerUrl?: string;
}

export interface RegisterFarmParams {
  owner: string;
  country: string;
  region: string;
  crop: string;
  farmSizeHectares: number;
  expectedYieldTons: number;
}

export type ContractInvocationStatus =
  | 'idle'
  | 'preparing'
  | 'simulating'
  | 'awaiting_signature'
  | 'submitting'
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'rejected';

export interface FarmRegisteredEvent {
  eventType: 'FarmRegistered';
  farmId: string;
  owner: string;
  crop: string;
  country: string;
  txHash: string;
  ledger: number;
  timestamp: number;
}

export interface ActivityItem {
  id: string;
  type: 'farm_registered' | 'payment_sent' | 'contract_invocation';
  title: string;
  subtitle: string;
  hash: string;
  timestamp: number;
  explorerUrl: string;
  status: 'confirmed' | 'pending' | 'failed';
  metadata?: Record<string, any>;
}
