import { describe, it, expect } from 'vitest';
import { LedgerTtlTracker } from '../packages/contracts-client/src/ledgerTtlTracker';

describe('LedgerTtlTracker', () => {
  const contractId = 'C' + 'A'.repeat(55);

  it('accurately reports active TTL status when well above threshold', () => {
    const status = LedgerTtlTracker.evaluateTtl(
      contractId,
      'instance',
      100000,
      120000, // 20000 ledgers remaining > 10000 threshold
      10000
    );

    expect(status.remainingLedgers).toBe(20000);
    expect(status.isExpiringSoon).toBe(false);
    expect(status.isExpired).toBe(false);
    expect(status.recommendedBumpExtension).toBe(0);
  });

  it('triggers warning and bump recommendation when approaching expiration', () => {
    const status = LedgerTtlTracker.evaluateTtl(
      contractId,
      'persistent',
      100000,
      105000, // 5000 remaining <= 10000 threshold
      10000,
      'member:GA7Q...'
    );

    expect(status.remainingLedgers).toBe(5000);
    expect(status.isExpiringSoon).toBe(true);
    expect(status.isExpired).toBe(false);
    expect(status.recommendedBumpExtension).toBe(LedgerTtlTracker.DEFAULT_BUMP_AMOUNT_LEDGERS);
  });

  it('marks state as expired when liveUntilLedger is in the past', () => {
    const status = LedgerTtlTracker.evaluateTtl(
      contractId,
      'contract_code',
      105000,
      104000
    );

    expect(status.remainingLedgers).toBe(0);
    expect(status.isExpired).toBe(true);
    expect(status.isExpiringSoon).toBe(true);
  });

  it('generates bump footprint request and rent fee estimate', () => {
    const bump = LedgerTtlTracker.generateBumpRequest(
      contractId,
      'instance',
      100000,
      50000,
      undefined,
      1024
    );

    expect(bump.contractId).toBe(contractId);
    expect(bump.extendToLedger).toBe(150000);
    expect(bump.estimatedFeeStroops).toBe(51200); // 1024 * 50000 * 1 * 0.001
  });
});
