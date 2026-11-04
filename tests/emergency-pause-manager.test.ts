import { describe, it, expect } from 'vitest';
import { EmergencyPauseManager } from '../packages/contracts-client/src/emergencyPauseManager';

describe('EmergencyPauseManager', () => {
  const guardian1 = 'G' + 'A'.repeat(55);
  const attacker = 'G' + 'B'.repeat(55);

  it('allows authorized guardian to pause lending and blocks unauthorized actors', () => {
    const manager = new EmergencyPauseManager([guardian1]);

    expect(manager.isModuleOperational('LENDING')).toBe(true);

    // Attacker attempts pause
    expect(() => {
      manager.pauseModule('LENDING', attacker, 1000, 'Flash crash exploit');
    }).toThrow(/Unauthorized/);

    // Guardian pauses
    const status = manager.pauseModule('LENDING', guardian1, 1000, 'Flash crash exploit detected');
    expect(status.isPaused).toBe(true);
    expect(manager.isModuleOperational('LENDING')).toBe(false);
  });

  it('enforces timelock delay before executing unpause', () => {
    const manager = new EmergencyPauseManager([guardian1]);
    manager.pauseModule('MARKETPLACE', guardian1, 1000, 'Investigating bad trade');

    // Guardian requests unpause with 500 ledgers delay
    manager.requestTimelockedUnpause('MARKETPLACE', guardian1, 1010, 500);

    // Try unpause too early (at ledger 1200 < 1510)
    expect(() => {
      manager.executeUnpause('MARKETPLACE', 1200);
    }).toThrow(/Timelock delay not elapsed/);

    // Unpause after delay at ledger 1510
    const unpausedStatus = manager.executeUnpause('MARKETPLACE', 1510);
    expect(unpausedStatus.isPaused).toBe(false);
    expect(manager.isModuleOperational('MARKETPLACE')).toBe(true);
  });
});
