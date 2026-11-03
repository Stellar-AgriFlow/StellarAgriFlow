import { describe, it, expect } from 'vitest';
import { runBatchDisbursementSimulation } from '../scripts/simulate-batch-disbursement';

describe('Multi-Recipient Dividend Batch Disbursement Simulation', () => {
  it('simulates mass cooperative dividend distribution to 75 smallholder farmers', () => {
    const result = runBatchDisbursementSimulation(75, 120);

    expect(result.totalFarmers).toBe(75);
    expect(result.totalSurplusDividends).toBe(9000);
    expect(result.executionStatus).toBe('COMPLETED');
    expect(result.submittedTransactions).toBe(2);

    expect(result.plan.batches[0].operationsCount).toBe(40);
    expect(result.plan.batches[1].operationsCount).toBe(35);
    expect(result.plan.totalDisbursementAmount).toBe(9000);
    expect(result.plan.totalEstimatedFeeStroops).toBe(7500); // 75 * 100 stroops
  });
});
