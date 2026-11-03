export type PredicateType = 'Unconditional' | 'TimeBefore' | 'TimeAfter' | 'And' | 'Or' | 'Not';

export interface ClaimablePredicate {
  type: PredicateType;
  absBefore?: number;
  absAfter?: number;
  relBefore?: number;
  relAfter?: number;
  andPredicates?: ClaimablePredicate[];
  orPredicates?: ClaimablePredicate[];
}

export interface ClaimantEntry {
  destination: string;
  predicate: ClaimablePredicate;
}

export interface ClaimableBalanceRecord {
  id: string;
  sponsor: string;
  asset: string;
  amount: number;
  claimants: ClaimantEntry[];
  lastModifiedLedger: number;
  status: 'Claimable' | 'Claimed' | 'ClawedBack';
}

export function createTimeLockedClaimant(
  destination: string,
  unlockTimestamp: number
): ClaimantEntry {
  return {
    destination,
    predicate: {
      type: 'TimeAfter',
      absAfter: unlockTimestamp,
    },
  };
}
