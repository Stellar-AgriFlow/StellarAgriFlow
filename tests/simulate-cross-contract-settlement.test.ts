import { describe, it, expect } from 'vitest';
import { simulateCrossContractSettlement } from '../scripts/simulate-cross-contract-settlement';

describe('simulateCrossContractSettlement', () => {
  it('executes atomic 4-contract workflow and computes metrics', () => {
    const report = simulateCrossContractSettlement();

    expect(report.success).toBe(true);
    expect(report.summary.totalNodes).toBe(4);
    expect(report.summary.involvedContracts).toHaveLength(4);
    expect(report.summary.maxDepth).toBe(1);
    expect(report.summary.hasFailures).toBe(false);
    expect(report.summary.totalCpuInstructions).toBe(635_000);
    expect(report.warehouseTokenMinted).toBe('WHR-MAIZE-2026-001');
  });
});
