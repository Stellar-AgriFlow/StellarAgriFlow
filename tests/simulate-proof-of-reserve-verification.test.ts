import { describe, it, expect } from 'vitest';
import { simulateProofOfReserveWorkflow } from '../scripts/simulate-proof-of-reserve-verification';

describe('simulateProofOfReserveWorkflow', () => {
  it('successfully computes over-collateralized Proof-of-Reserve solvency report', () => {
    const report = simulateProofOfReserveWorkflow();

    expect(report.isSolventAndVerified).toBe(true);
    expect(report.totalSilosCount).toBe(3);
    expect(report.activeFreshSilosCount).toBe(3);
    expect(report.evaluation.totalPhysicalMetricTonnes).toBe(3250);
    expect(report.evaluation.requiredBackingMetricTonnes).toBe(3000);
    expect(report.evaluation.collateralizationRatioPercent).toBe(108.33);
    expect(report.attestationDigest).toHaveLength(64);
  });
});
