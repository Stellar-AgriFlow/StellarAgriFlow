import { describe, it, expect } from 'vitest';
import {
  BatchPaymentEngine,
  PaymentInstruction,
} from '../packages/contracts-client/src/batchPaymentEngine';

describe('BatchPaymentEngine Multi-Op Planner', () => {
  const makeAddress = (i: number) =>
    'G' + String(i).padStart(3, '0') + 'A'.repeat(52);

  it('chunks 120 payments into 3 batches with default chunk size of 50', () => {
    const instructions: PaymentInstruction[] = [];
    for (let i = 0; i < 120; i++) {
      instructions.push({
        destination: makeAddress(i),
        amount: 100,
        assetCode: 'USDC',
      });
    }

    const plan = BatchPaymentEngine.planDisbursement(instructions, 50);

    expect(plan.totalRecipients).toBe(120);
    expect(plan.totalDisbursementAmount).toBe(12000);
    expect(plan.totalBatches).toBe(3);

    expect(plan.batches[0].operationsCount).toBe(50);
    expect(plan.batches[1].operationsCount).toBe(50);
    expect(plan.batches[2].operationsCount).toBe(20);

    expect(plan.batches[0].estimatedFeeStroops).toBe(5000);
    expect(plan.totalEstimatedFeeStroops).toBe(12000);
  });

  it('clamps chunk size strictly to max 100 Stellar operations limit', () => {
    const instructions: PaymentInstruction[] = [];
    for (let i = 0; i < 150; i++) {
      instructions.push({
        destination: makeAddress(i),
        amount: 50,
      });
    }

    // Attempting chunkSize of 200 should be clamped to 100
    const plan = BatchPaymentEngine.planDisbursement(instructions, 200);
    expect(plan.batches[0].operationsCount).toBe(100);
    expect(plan.batches[1].operationsCount).toBe(50);
    expect(plan.totalBatches).toBe(2);
  });

  it('filters out malformed destination addresses and zero payments', () => {
    const dirtyList: PaymentInstruction[] = [
      { destination: makeAddress(1), amount: 100 },
      { destination: 'INVALID_DEST', amount: 200 },
      { destination: makeAddress(2), amount: 0 },
      { destination: makeAddress(3), amount: -50 },
      { destination: makeAddress(4), amount: 300 },
    ];

    const plan = BatchPaymentEngine.planDisbursement(dirtyList);
    expect(plan.totalRecipients).toBe(2);
    expect(plan.totalDisbursementAmount).toBe(400);
  });
});
