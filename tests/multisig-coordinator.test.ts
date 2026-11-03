import { describe, it, expect } from 'vitest';
import {
  MultiSigCoordinator,
  SignerConfig,
  MultiSigThresholds,
} from '../packages/contracts-client/src/multiSigCoordinator';

describe('MultiSigCoordinator Threshold Tracking', () => {
  const signers: SignerConfig[] = [
    { publicKey: 'G' + 'A'.repeat(55), weight: 1 },
    { publicKey: 'G' + 'B'.repeat(55), weight: 1 },
    { publicKey: 'G' + 'C'.repeat(55), weight: 1 },
  ];

  const thresholds: MultiSigThresholds = {
    lowThreshold: 1,
    medThreshold: 2,
    highThreshold: 3,
  };

  it('tracks progress towards medium (2-of-3) and high (3-of-3) thresholds', () => {
    const coordinator = new MultiSigCoordinator(signers, thresholds);

    // Initial state
    const initial = coordinator.evaluateProgress();
    expect(initial.totalWeightCollected).toBe(0);
    expect(initial.medThresholdSatisfied).toBe(false);
    expect(initial.weightNeededForMed).toBe(2);

    // Add first signature
    const added1 = coordinator.addSignature(signers[0].publicKey, 'SIG_A_BASE64');
    expect(added1).toBe(true);

    const step1 = coordinator.evaluateProgress();
    expect(step1.totalWeightCollected).toBe(1);
    expect(step1.medThresholdSatisfied).toBe(false);
    expect(step1.weightNeededForMed).toBe(1);

    // Add second signature -> medium threshold satisfied!
    const added2 = coordinator.addSignature(signers[1].publicKey, 'SIG_B_BASE64');
    expect(added2).toBe(true);

    const step2 = coordinator.evaluateProgress();
    expect(step2.totalWeightCollected).toBe(2);
    expect(step2.medThresholdSatisfied).toBe(true);
    expect(step2.highThresholdSatisfied).toBe(false);
    expect(step2.weightNeededForHigh).toBe(1);

    // Add third signature -> high threshold satisfied!
    coordinator.addSignature(signers[2].publicKey, 'SIG_C_BASE64');
    const step3 = coordinator.evaluateProgress();
    expect(step3.totalWeightCollected).toBe(3);
    expect(step3.highThresholdSatisfied).toBe(true);
    expect(step3.weightNeededForHigh).toBe(0);
  });

  it('rejects unrecognized signers not registered in configuration', () => {
    const coordinator = new MultiSigCoordinator(signers, thresholds);
    const unknown = coordinator.addSignature('G' + 'Z'.repeat(55), 'FAKESIG');
    expect(unknown).toBe(false);
    expect(coordinator.evaluateProgress().totalWeightCollected).toBe(0);
  });
});
