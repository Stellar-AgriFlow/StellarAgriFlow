import { describe, it, expect } from 'vitest';
import { simulateClaimableBalanceEscrow } from '../scripts/simulate-claimable-escrow';

describe('Claimable Balance Escrow Simulation', () => {
  it('simulates successful grain inspection and seller payout', () => {
    const res = simulateClaimableBalanceEscrow(true);

    expect(res.tradeId).toBe(401);
    expect(res.status).toBe('RELEASED_TO_SELLER');
    expect(res.inspectionPassed).toBe(true);
    expect(res.plan.isValid).toBe(true);
    expect(res.plan.amount).toBe(8500);
    expect(res.plan.claimants.length).toBe(2);
  });

  it('simulates failed grain inspection and buyer refund', () => {
    const res = simulateClaimableBalanceEscrow(false);

    expect(res.tradeId).toBe(401);
    expect(res.status).toBe('REFUNDED_TO_BUYER');
    expect(res.inspectionPassed).toBe(false);
  });
});
