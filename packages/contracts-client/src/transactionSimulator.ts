export interface SorobanSimulationResourceReport {
  cpuInstructions: number;
  memoryBytes: number;
  readOnlyStorageKeys: number;
  readWriteStorageKeys: number;
  minResourceFeeStroops: number;
  isWithinResourceLimits: boolean;
  warnings: string[];
}

export interface SimulationResult<T = unknown> {
  success: boolean;
  returnValue?: T;
  error?: string;
  resources: SorobanSimulationResourceReport;
  footprintSizeBytes: number;
  recommendedClassicFeeStroops: number;
  totalEstimatedFeeStroops: number;
}

export class TransactionSimulator {
  // Stellar Soroban Mainnet / Testnet Network Max Limits
  public static readonly MAX_CPU_INSTRUCTIONS = 100_000_000;
  public static readonly MAX_MEMORY_BYTES = 41_943_040; // 40 MB
  public static readonly MAX_READ_WRITE_KEYS = 40;
  public static readonly BASE_CLASSIC_TX_FEE_STROOPS = 100;

  public static analyzeSimulationResponse(
    cpuInstructions: number,
    memoryBytes: number,
    readOnlyKeysCount: number,
    readWriteKeysCount: number,
    minResourceFeeStroops: number,
    returnValue?: unknown,
    error?: string
  ): SimulationResult {
    const warnings: string[] = [];
    let isWithinLimits = true;

    if (cpuInstructions > this.MAX_CPU_INSTRUCTIONS) {
      warnings.push(`CPU instructions (${cpuInstructions}) exceed maximum network limit of ${this.MAX_CPU_INSTRUCTIONS}`);
      isWithinLimits = false;
    } else if (cpuInstructions > this.MAX_CPU_INSTRUCTIONS * 0.8) {
      warnings.push(`High CPU usage: consumed > 80% of block limit (${cpuInstructions})`);
    }

    if (memoryBytes > this.MAX_MEMORY_BYTES) {
      warnings.push(`Memory consumption (${memoryBytes} bytes) exceeds maximum network limit`);
      isWithinLimits = false;
    }

    if (readWriteKeysCount > this.MAX_READ_WRITE_KEYS) {
      warnings.push(`Read/Write keys count (${readWriteKeysCount}) exceeds network footprint limit of ${this.MAX_READ_WRITE_KEYS}`);
      isWithinLimits = false;
    }

    const estimatedFootprintSize = (readOnlyKeysCount + readWriteKeysCount) * 128; // avg 128 bytes per key
    const totalEstimatedFee = minResourceFeeStroops + this.BASE_CLASSIC_TX_FEE_STROOPS;

    return {
      success: !error && isWithinLimits,
      returnValue,
      error,
      resources: {
        cpuInstructions,
        memoryBytes,
        readOnlyStorageKeys: readOnlyKeysCount,
        readWriteStorageKeys: readWriteKeysCount,
        minResourceFeeStroops,
        isWithinResourceLimits: isWithinLimits,
        warnings,
      },
      footprintSizeBytes: estimatedFootprintSize,
      recommendedClassicFeeStroops: this.BASE_CLASSIC_TX_FEE_STROOPS,
      totalEstimatedFeeStroops: totalEstimatedFee,
    };
  }

  public static mockPreflightSimulation(
    contractFunction: string,
    argsLength: number
  ): SimulationResult {
    // Deterministic simulation estimator for pre-flight verification
    const baseCpu = 2_500_000;
    const cpuInstructions = baseCpu + argsLength * 150_000;
    const memoryBytes = 1_048_576 + argsLength * 65_536; // ~1MB base + 64KB per arg
    const readOnlyKeys = Math.min(10, 2 + argsLength);
    const readWriteKeys = Math.min(5, 1 + Math.floor(argsLength / 2));
    const minResourceFeeStroops = Math.round(cpuInstructions * 0.0001 + memoryBytes * 0.00005);

    return this.analyzeSimulationResponse(
      cpuInstructions,
      memoryBytes,
      readOnlyKeys,
      readWriteKeys,
      minResourceFeeStroops,
      { simulated: true, function: contractFunction }
    );
  }
}
