import { describe, it, expect } from 'vitest';
import { simulateMultiAuthLoanInvocation } from '../scripts/simulate-multi-auth-invocation';

describe('simulateMultiAuthLoanInvocation', () => {
  it('successfully completes two-party Soroban authorization flow', () => {
    const result = simulateMultiAuthLoanInvocation();

    expect(result.success).toBe(true);
    expect(result.step1Completed).toBe(false);
    expect(result.step2Completed).toBe(true);
    expect(result.totalAuthEntriesCompiled).toBe(2);
    expect(result.farmerPubkey).toMatch(/^G[A-Z0-9]{55}$/);
    expect(result.coopPubkey).toMatch(/^G[A-Z0-9]{55}$/);
  });
});
