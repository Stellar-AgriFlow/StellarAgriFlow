export interface TransactionTimeBounds {
  minTime: number;
  maxTime: number;
}

export interface LedgerBounds {
  minLedger: number;
  maxLedger: number;
}

export interface Preconditions {
  timeBounds?: TransactionTimeBounds;
  ledgerBounds?: LedgerBounds;
  minSequenceAge?: number;
  minSequenceLedgerGap?: number;
}

export function formatTimeBoundDuration(timeBounds: TransactionTimeBounds): string {
  if (timeBounds.maxTime === 0) return 'Unbounded';
  const duration = Math.max(0, timeBounds.maxTime - timeBounds.minTime);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
}
