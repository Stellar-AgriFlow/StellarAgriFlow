import { describe, it, expect } from 'vitest';
import { AccountMergeRecovery } from '../packages/contracts-client/src/accountMergeRecovery';

describe('AccountMergeRecovery Helper', () => {
  const source = 'G' + 'A'.repeat(55);
  const destination = 'G' + 'B'.repeat(55);

  it('validates successful account merge plan and returns reclaimable balance', () => {
    const plan = AccountMergeRecovery.planAccountMerge(
      { sourceAccount: source, destinationAccount: destination },
      2, // 2 subentries
      2.5 // 2.5 XLM total balance
    );

    expect(plan.isValid).toBe(true);
    expect(plan.sourceAccount).toBe(source);
    expect(plan.destinationAccount).toBe(destination);
    expect(plan.estimatedReclaimedXlm).toBe(2.5);
  });

  it('rejects merging account into itself to prevent network error', () => {
    const plan = AccountMergeRecovery.planAccountMerge({
      sourceAccount: source,
      destinationAccount: source,
    });

    expect(plan.isValid).toBe(false);
    expect(plan.reason).toBe('Source and destination accounts cannot be identical');
  });

  it('rejects invalid or malformed source / destination addresses', () => {
    const badSource = AccountMergeRecovery.planAccountMerge({
      sourceAccount: 'NOT_A_KEY',
      destinationAccount: destination,
    });
    expect(badSource.isValid).toBe(false);

    const badDest = AccountMergeRecovery.planAccountMerge({
      sourceAccount: source,
      destinationAccount: 'NOT_A_KEY',
    });
    expect(badDest.isValid).toBe(false);
  });
});
