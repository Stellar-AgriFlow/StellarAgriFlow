import { describe, it, expect } from 'vitest';
import {
  createTimeLockedClaimant,
  ClaimantEntry,
} from '../packages/types/src/claimableBalance';

describe('Claimable Balance Types & Helpers', () => {
  const destination = 'G' + 'C'.repeat(55);
  const unlock = 1750000000;

  it('creates valid time-locked claimant structure', () => {
    const entry: ClaimantEntry = createTimeLockedClaimant(destination, unlock);

    expect(entry.destination).toBe(destination);
    expect(entry.predicate.type).toBe('TimeAfter');
    expect(entry.predicate.absAfter).toBe(unlock);
  });
});
