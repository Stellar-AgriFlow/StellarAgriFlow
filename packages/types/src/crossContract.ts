export type CrossContractCallStatus = 'SUCCESS' | 'REVERTED';

export interface CrossContractCallFrame {
  frameId: string;
  contractId: string;
  contractName: string;
  functionName: string;
  depth: number;
  parentFrameId?: string;
  args: unknown[];
  returnValue?: unknown;
  status: CrossContractCallStatus;
  errorMessage?: string;
  cpuInstructions: number;
  memoryBytes: number;
  timestamp: number;
}

export interface CrossContractCallGraph {
  transactionHash: string;
  rootContractId: string;
  rootContractName: string;
  status: CrossContractCallStatus;
  frames: CrossContractCallFrame[];
  maxDepth: number;
  totalCpuInstructions: number;
  totalMemoryBytes: number;
  involvedContracts: string[];
  executionTimeMs: number;
}

export type CrossContractEventType =
  | 'SUB_CALL_INIT'
  | 'SUB_CALL_SUCCESS'
  | 'SUB_CALL_REVERT'
  | 'CONTRACT_AUTH_CHECK';

export interface CrossContractEventRecord {
  id: string;
  type: CrossContractEventType;
  contractId: string;
  functionName: string;
  payload: Record<string, unknown>;
  timestamp: number;
}
