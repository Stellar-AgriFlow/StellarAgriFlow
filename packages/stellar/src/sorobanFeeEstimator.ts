export interface SorobanResourceFootprint {
  cpuInstructions: number;
  readBytes: number;
  writeBytes: number;
  ledgerEntriesRead: number;
  ledgerEntriesWritten: number;
}

export interface ResourceFeeBreakdown {
  cpuFeeStroops: number;
  storageFeeStroops: number;
  writeFeeStroops: number;
  totalResourceFeeStroops: number;
}

export class SorobanFeeEstimator {
  // Stellar Soroban fee rates (Testnet/Mainnet reference)
  private static readonly STROOPS_PER_10K_CPU = 1;
  private static readonly STROOPS_PER_KB_READ = 5;
  private static readonly STROOPS_PER_KB_WRITE = 25;
  private static readonly STROOPS_PER_ENTRY_WRITE = 100;

  /**
   * Estimates resource fee in stroops from simulated footprint
   */
  static estimateResourceFee(footprint: SorobanResourceFootprint): ResourceFeeBreakdown {
    const cpuFeeStroops = Math.ceil(
      (footprint.cpuInstructions / 10000) * this.STROOPS_PER_10K_CPU
    );

    const storageFeeStroops = Math.ceil(
      (footprint.readBytes / 1024) * this.STROOPS_PER_KB_READ
    );

    const writeFeeStroops =
      Math.ceil((footprint.writeBytes / 1024) * this.STROOPS_PER_KB_WRITE) +
      footprint.ledgerEntriesWritten * this.STROOPS_PER_ENTRY_WRITE;

    const totalResourceFeeStroops = cpuFeeStroops + storageFeeStroops + writeFeeStroops;

    return {
      cpuFeeStroops,
      storageFeeStroops,
      writeFeeStroops,
      totalResourceFeeStroops,
    };
  }

  /**
   * Applies safety buffer multiplier (e.g. 1.25 for 25% safety buffer)
   */
  static applySafetyBuffer(feeStroops: number, bufferPercent: number = 20): number {
    return Math.ceil(feeStroops * (1 + bufferPercent / 100));
  }
}
