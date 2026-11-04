export type SorobanStorageType = 'instance' | 'persistent' | 'temporary' | 'contract_code';

export interface EntryTtlStatus {
  contractId: string;
  storageType: SorobanStorageType;
  entryKey?: string;
  currentLedger: number;
  liveUntilLedger: number;
  remainingLedgers: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  recommendedBumpExtension: number;
}

export interface BumpFootprintRequest {
  contractId: string;
  storageType: SorobanStorageType;
  entryKey?: string;
  extendToLedger: number;
  estimatedFeeStroops: number;
}

export class LedgerTtlTracker {
  // 1 ledger is approx 5 seconds on Stellar (~17,280 ledgers per day)
  public static readonly DEFAULT_WARNING_THRESHOLD_LEDGERS = 10000; // ~ 14 hours
  public static readonly DEFAULT_BUMP_AMOUNT_LEDGERS = 518400; // ~ 30 days
  public static readonly STROOPS_PER_BYTE_PER_LEDGER = 1; // standard network base rent estimation factor

  public static evaluateTtl(
    contractId: string,
    storageType: SorobanStorageType,
    currentLedger: number,
    liveUntilLedger: number,
    warningThreshold = LedgerTtlTracker.DEFAULT_WARNING_THRESHOLD_LEDGERS,
    entryKey?: string
  ): EntryTtlStatus {
    const remainingLedgers = Math.max(0, liveUntilLedger - currentLedger);
    const isExpired = remainingLedgers === 0;
    const isExpiringSoon = remainingLedgers <= warningThreshold;

    return {
      contractId,
      storageType,
      entryKey,
      currentLedger,
      liveUntilLedger,
      remainingLedgers,
      isExpiringSoon,
      isExpired,
      recommendedBumpExtension: isExpiringSoon ? LedgerTtlTracker.DEFAULT_BUMP_AMOUNT_LEDGERS : 0,
    };
  }

  public static generateBumpRequest(
    contractId: string,
    storageType: SorobanStorageType,
    currentLedger: number,
    bumpLedgers = LedgerTtlTracker.DEFAULT_BUMP_AMOUNT_LEDGERS,
    entryKey?: string,
    entrySizeBytes = 512
  ): BumpFootprintRequest {
    const extendToLedger = currentLedger + bumpLedgers;
    const estimatedFeeStroops = this.estimateRentFee(entrySizeBytes, bumpLedgers);

    return {
      contractId,
      storageType,
      entryKey,
      extendToLedger,
      estimatedFeeStroops,
    };
  }

  public static estimateRentFee(
    entrySizeBytes: number,
    ledgersToExtend: number,
    rentPerBytePerLedger = LedgerTtlTracker.STROOPS_PER_BYTE_PER_LEDGER
  ): number {
    if (entrySizeBytes < 0 || ledgersToExtend < 0) {
      throw new Error('Size and ledgers must be non-negative');
    }
    // Estimated storage rent in stroops
    return Math.ceil(entrySizeBytes * ledgersToExtend * rentPerBytePerLedger * 0.001);
  }
}
