import { describe, it, expect } from 'vitest';
import { EmergencyPauseState, EmergencyGuardianAction } from '../packages/types/src/emergency';

describe('Emergency Types', () => {
  it('instantiates valid EmergencyPauseState and EmergencyGuardianAction', () => {
    const pauseState: EmergencyPauseState = {
      moduleId: 'TREASURY',
      isPaused: true,
      pausedBy: 'G' + 'A'.repeat(55),
      pausedAtLedger: 120500,
      reason: 'Extreme collateral volatility detected',
      timelockExpiresLedger: 137780,
      unpauseInitiator: 'G' + 'B'.repeat(55),
    };

    const action: EmergencyGuardianAction = {
      actionId: 'act-001',
      guardianPublicKey: 'G' + 'A'.repeat(55),
      actionType: 'PAUSE',
      moduleId: 'TREASURY',
      ledgerNumber: 120500,
      reason: 'Extreme collateral volatility detected',
      timestamp: Date.now(),
    };

    expect(pauseState.isPaused).toBe(true);
    expect(pauseState.moduleId).toBe('TREASURY');
    expect(action.actionType).toBe('PAUSE');
    expect(action.guardianPublicKey).toMatch(/^G[A-Z0-9]{55}$/);
  });
});
