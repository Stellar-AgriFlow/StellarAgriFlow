import { describe, it, expect } from 'vitest';
import { simulateEmergencyFreezeAndRecovery } from '../scripts/simulate-emergency-freeze';

describe('simulateEmergencyFreezeAndRecovery', () => {
  it('successfully triggers emergency pause and executes timelocked recovery', () => {
    const report = simulateEmergencyFreezeAndRecovery();

    expect(report.success).toBe(true);
    expect(report.lendingPausedRecord.isPaused).toBe(true);
    expect(report.liquidationPausedRecord.isPaused).toBe(true);
    expect(report.timelockExpiryLedger).toBe(report.initialLedger + 110);
    expect(report.finalOperationalStatus).toBe(true);
  });
});
