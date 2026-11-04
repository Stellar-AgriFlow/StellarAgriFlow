import { EmergencyPauseManager, ModulePauseRecord } from '../packages/contracts-client/src/emergencyPauseManager';

export interface EmergencyFreezeSimulationReport {
  initialLedger: number;
  triggerReason: string;
  lendingPausedRecord: ModulePauseRecord;
  liquidationPausedRecord: ModulePauseRecord;
  timelockExpiryLedger: number;
  unpauseExecutedAtLedger: number;
  finalOperationalStatus: boolean;
  success: boolean;
}

export function simulateEmergencyFreezeAndRecovery(): EmergencyFreezeSimulationReport {
  const guardianKey = 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL';
  const manager = new EmergencyPauseManager([guardianKey]);
  const initialLedger = 200000;
  const timelockDelay = 100; // 100 ledgers for simulation

  // 1. Circuit breaker fires: Guardian pauses LENDING and LIQUIDATION
  const reason = 'Oracle anomaly: Commodity price dropped 45% below MAD bounds within single block';
  const lendingPaused = manager.pauseModule('LENDING', guardianKey, initialLedger, reason);
  const liquidationPaused = manager.pauseModule('LIQUIDATION', guardianKey, initialLedger, reason);

  // 2. Schedule timelocked unpause
  const scheduledLending = manager.requestTimelockedUnpause(
    'LENDING',
    guardianKey,
    initialLedger + 10,
    timelockDelay
  );
  const timelockExpiryLedger = scheduledLending.timelockUnpauseLedger!;

  // 3. Fast-forward past timelock delay and execute unpause
  const unpauseLedger = timelockExpiryLedger + 5;
  const unpausedLending = manager.executeUnpause('LENDING', unpauseLedger);

  return {
    initialLedger,
    triggerReason: reason,
    lendingPausedRecord: lendingPaused,
    liquidationPausedRecord: liquidationPaused,
    timelockExpiryLedger,
    unpauseExecutedAtLedger: unpauseLedger,
    finalOperationalStatus: manager.isModuleOperational('LENDING'),
    success: !unpausedLending.isPaused && manager.isModuleOperational('LENDING'),
  };
}

if (process.env.RUN_STANDALONE === 'true') {
  const res = simulateEmergencyFreezeAndRecovery();
  console.log('--- Emergency Freeze and Timelocked Resumption Simulation ---');
  console.log(JSON.stringify(res, null, 2));
}
