import { describe, it, expect } from 'vitest';
import { TransactionSimulator } from '../packages/contracts-client/src/transactionSimulator';

describe('TransactionSimulator', () => {
  it('analyzes standard compliant simulation within Soroban resource bounds', () => {
    const result = TransactionSimulator.analyzeSimulationResponse(
      15_000_000, // 15M CPU < 100M max
      2_000_000,  // 2MB < 40MB max
      4,          // 4 read keys
      2,          // 2 write keys
      3500,       // minResourceFee
      { status: 'ok' }
    );

    expect(result.success).toBe(true);
    expect(result.resources.isWithinResourceLimits).toBe(true);
    expect(result.resources.warnings).toHaveLength(0);
    expect(result.footprintSizeBytes).toBe(768); // 6 keys * 128
    expect(result.totalEstimatedFeeStroops).toBe(3600); // 3500 + 100
  });

  it('flags warning when CPU exceeds 80% threshold', () => {
    const result = TransactionSimulator.analyzeSimulationResponse(
      85_000_000, // 85M > 80M
      1_000_000,
      1,
      1,
      12000
    );

    expect(result.success).toBe(true);
    expect(result.resources.warnings.some((w) => w.includes('High CPU usage'))).toBe(true);
  });

  it('fails simulation when read-write storage keys exceed network maximum', () => {
    const result = TransactionSimulator.analyzeSimulationResponse(
      10_000_000,
      1_000_000,
      10,
      45, // > 40 max
      5000
    );

    expect(result.success).toBe(false);
    expect(result.resources.isWithinResourceLimits).toBe(false);
    expect(result.resources.warnings.some((w) => w.includes('Read/Write keys count'))).toBe(true);
  });

  it('runs deterministic mock preflight simulation for contract functions', () => {
    const result = TransactionSimulator.mockPreflightSimulation('disburse_batch', 4);

    expect(result.success).toBe(true);
    expect(result.resources.cpuInstructions).toBeGreaterThan(2_500_000);
    expect(result.totalEstimatedFeeStroops).toBeGreaterThan(100);
    expect((result.returnValue as any).simulated).toBe(true);
  });
});
