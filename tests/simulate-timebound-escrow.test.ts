import { describe, it, expect } from 'vitest';
import { simulateTimeboundEscrowLifecycle } from '../scripts/simulate-timebound-escrow';

describe('Timebound Expiration and Recovery Simulation', () => {
  it('detects initial expired submission and completes safe retry with fresh window', () => {
    const res = simulateTimeboundEscrowLifecycle();

    expect(res.attempt1.eval.status).toBe('EXPIRED');
    expect(res.attempt1.eval.isValid).toBe(false);

    expect(res.attempt2Retry.eval.status).toBe('ACTIVE');
    expect(res.attempt2Retry.eval.isValid).toBe(true);

    expect(res.recoveredSuccessfully).toBe(true);
  });
});
