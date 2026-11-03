import { describe, it, expect } from 'vitest';
import {
  ClaimableBalanceHelper,
  ClaimantCondition,
} from '../packages/contracts-client/src/claimableBalanceHelper';

describe('ClaimableBalanceHelper SDK', () => {
  const sponsor = 'G' + 'A'.repeat(55);
  const farmer = 'G' + 'B'.repeat(55);
  const baseTime = 1700000000;

  it('creates valid claimable balance plan with time unlock predicate', () => {
    const claimants: ClaimantCondition[] = [
      {
        claimant: farmer,
        notBeforeTimestamp: baseTime + 86400, // 24 hours lock
        notAfterTimestamp: baseTime + 7 * 86400, // 7 days expiry
      },
    ];

    const plan = ClaimableBalanceHelper.planClaimableBalance(
      sponsor,
      'USDC',
      5000,
      claimants
    );

    expect(plan.isValid).toBe(true);
    expect(plan.amount).toBe(5000);
    expect(plan.sponsor).toBe(sponsor);
    expect(plan.claimants.length).toBe(1);
    expect(plan.predicateDescription).toContain('Unlocks at');
    expect(plan.predicateDescription).toContain('Expires at');
  });

  it('rejects claimable balance with zero or negative amount', () => {
    const claimants: ClaimantCondition[] = [{ claimant: farmer }];
    const plan = ClaimableBalanceHelper.planClaimableBalance(sponsor, 'USDC', 0, claimants);

    expect(plan.isValid).toBe(false);
    expect(plan.reason).toBe('Claimable balance amount must be positive');
  });

  it('rejects invalid claimant address', () => {
    const claimants: ClaimantCondition[] = [{ claimant: 'NOT_A_KEY' }];
    const plan = ClaimableBalanceHelper.planClaimableBalance(sponsor, 'USDC', 1000, claimants);

    expect(plan.isValid).toBe(false);
    expect(plan.reason).toContain('Invalid claimant address');
  });
});
