export interface SignerConfig {
  publicKey: string;
  weight: number;
}

export interface MultiSigThresholds {
  lowThreshold: number; // e.g. 1
  medThreshold: number; // e.g. 2 (Payments, disbursements)
  highThreshold: number; // e.g. 3 (Key rotation, emergency pause)
}

export interface CollectedSignature {
  signer: string;
  signatureBase64: string;
}

export interface MultiSigProgress {
  totalWeightCollected: number;
  medThresholdSatisfied: boolean;
  highThresholdSatisfied: boolean;
  weightNeededForMed: number;
  weightNeededForHigh: number;
  signersCollected: string[];
}

export class MultiSigCoordinator {
  private signers: Map<string, number> = new Map();
  private thresholds: MultiSigThresholds;
  private collectedSignatures: Map<string, string> = new Map();

  constructor(signers: SignerConfig[], thresholds: MultiSigThresholds) {
    this.thresholds = thresholds;
    for (const s of signers) {
      this.signers.set(s.publicKey, s.weight);
    }
  }

  /**
   * Adds a signature from a recognized signer
   */
  addSignature(signer: string, signatureBase64: string): boolean {
    if (!this.signers.has(signer)) {
      return false; // Unknown signer
    }
    this.collectedSignatures.set(signer, signatureBase64);
    return true;
  }

  /**
   * Evaluates current signature collection progress towards thresholds
   */
  evaluateProgress(): MultiSigProgress {
    let totalWeightCollected = 0;
    const signersCollected: string[] = [];

    for (const signer of this.collectedSignatures.keys()) {
      const weight = this.signers.get(signer) || 0;
      totalWeightCollected += weight;
      signersCollected.push(signer);
    }

    const medSatisfied = totalWeightCollected >= this.thresholds.medThreshold;
    const highSatisfied = totalWeightCollected >= this.thresholds.highThreshold;

    const weightNeededForMed = Math.max(0, this.thresholds.medThreshold - totalWeightCollected);
    const weightNeededForHigh = Math.max(0, this.thresholds.highThreshold - totalWeightCollected);

    return {
      totalWeightCollected,
      medThresholdSatisfied: medSatisfied,
      highThresholdSatisfied: highSatisfied,
      weightNeededForMed,
      weightNeededForHigh,
      signersCollected,
    };
  }

  getCollectedSignatures(): CollectedSignature[] {
    return Array.from(this.collectedSignatures.entries()).map(([signer, sig]) => ({
      signer,
      signatureBase64: sig,
    }));
  }

  clearSignatures(): void {
    this.collectedSignatures.clear();
  }
}
