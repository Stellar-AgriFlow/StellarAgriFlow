export type EmergencyModuleId =
  | 'TREASURY'
  | 'MARKETPLACE'
  | 'ESCROW'
  | 'LENDING'
  | 'LIQUIDATION'
  | 'INSURANCE';

export interface EmergencyPauseState {
  moduleId: EmergencyModuleId;
  isPaused: boolean;
  pausedBy?: string;
  pausedAtLedger?: number;
  reason?: string;
  timelockExpiresLedger?: number;
  unpauseInitiator?: string;
}

export type EmergencyActionType =
  | 'PAUSE'
  | 'REQUEST_UNPAUSE'
  | 'EXECUTE_UNPAUSE'
  | 'ADD_GUARDIAN'
  | 'REMOVE_GUARDIAN';

export interface EmergencyGuardianAction {
  actionId: string;
  guardianPublicKey: string;
  actionType: EmergencyActionType;
  moduleId?: EmergencyModuleId;
  ledgerNumber: number;
  reason?: string;
  signature?: string;
  timestamp: number;
}

export interface EmergencyCircuitBreakerConfig {
  maxDivergenceBps: number; // e.g. 1500 = 15% price divergence triggers pause
  autoPauseOnOracleHalt: boolean;
  minTimelockDelayLedgers: number;
  guardiansQuorumRequired: number;
}
