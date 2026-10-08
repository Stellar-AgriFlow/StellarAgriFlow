export type AgriculturalPaymentPurpose =
  | 'Farm Input'
  | 'Farmer Payment'
  | 'Produce Purchase'
  | 'Logistics'
  | 'Other';

export interface PaymentFormData {
  recipientAddress: string;
  amount: string;
  purpose: AgriculturalPaymentPurpose;
  memo?: string;
}

export type TransactionLifecycleStatus =
  | 'idle'
  | 'validating'
  | 'preparing'
  | 'awaiting_approval'
  | 'submitting'
  | 'pending'
  | 'success'
  | 'failed';

export interface AccountBalance {
  totalXlm: string;
  availableXlm: string;
  baseReserve: string;
  subentryCount: number;
  isFunded: boolean;
  lastUpdated: number;
}

export interface PaymentReceipt {
  hash: string;
  ledger: number;
  createdAt: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: string;
  asset: string;
  purpose: AgriculturalPaymentPurpose;
  explorerUrl: string;
}

export interface TransactionExecutionResult {
  successful: boolean;
  hash?: string;
  ledger?: number;
  error?: string;
  receipt?: PaymentReceipt;
}
