export type SorobanCredentialType = 'source_account' | 'contract';

export interface SorobanAddressCredential {
  type: 'source_account';
  address: string;
  nonce: number;
  signatureExpirationLedger: number;
}

export interface SorobanContractCredential {
  type: 'contract';
  contractId: string;
  nonce: number;
  signatureExpirationLedger: number;
}

export type SorobanCredential = SorobanAddressCredential | SorobanContractCredential;

export interface SorobanSubInvocationSpec {
  contractId: string;
  functionName: string;
  args: unknown[];
  subInvocations?: SorobanSubInvocationSpec[];
}

export interface SorobanAuthorizedInvocation {
  contractId: string;
  functionName: string;
  args: unknown[];
  subInvocations?: SorobanSubInvocationSpec[];
}

export interface SorobanAuthRecord {
  id: string;
  credentials: SorobanCredential;
  rootInvocation: SorobanAuthorizedInvocation;
  signature?: string;
  signerPublicKey: string;
  isSigned: boolean;
  timestamp: number;
}

export type MultiAuthStatus = 'PENDING' | 'READY' | 'EXPIRED' | 'REJECTED';

export interface MultiAuthSessionRecord {
  sessionId: string;
  description: string;
  status: MultiAuthStatus;
  requiredSigners: string[];
  collectedSignaturesCount: number;
  entries: SorobanAuthRecord[];
  createdAtLedger: number;
  expiresAtLedger: number;
}
