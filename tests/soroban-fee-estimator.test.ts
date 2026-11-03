import { describe, it, expect } from 'vitest';
import { SorobanFeeEstimator } from '../packages/stellar/src/sorobanFeeEstimator';

describe('Soroban Resource Fee Estimator', () => {
  it('calculates CPU, read, write, and entry fees accurately from footprint', () => {
    const footprint = {
      cpuInstructions: 100000, // 100k CPU => 10 stroops
      readBytes: 2048, // 2 KB read => 10 stroops
      writeBytes: 1024, // 1 KB write => 25 stroops
      ledgerEntriesRead: 2,
      ledgerEntriesWritten: 2, // 2 entries => 200 stroops
    };

    const breakdown = SorobanFeeEstimator.estimateResourceFee(footprint);

    expect(breakdown.cpuFeeStroops).toBe(10);
    expect(breakdown.storageFeeStroops).toBe(10);
    expect(breakdown.writeFeeStroops).toBe(225); // 25 + 200
    expect(breakdown.totalResourceFeeStroops).toBe(245);
  });

  it('applies safety buffer percentage multiplier properly', () => {
    const baseFee = 1000;
    const withBuffer = SorobanFeeEstimator.applySafetyBuffer(baseFee, 25);
    expect(withBuffer).toBe(1250);
  });
});
