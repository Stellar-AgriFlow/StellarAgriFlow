import { describe, it, expect } from 'vitest';

export function calculateQuorumRequired(totalShares: number, quorumPercent: number): number {
  if (totalShares <= 0 || quorumPercent <= 0) return 0;
  return Math.floor((totalShares * quorumPercent) / 100);
}

export function isQuorumReached(votesFor: number, quorumRequired: number): boolean {
  return votesFor >= quorumRequired;
}

export function calculateVotingPower(memberShares: number, totalShares: number): number {
  if (totalShares <= 0) return 0;
  return Number(((memberShares / totalShares) * 100).toFixed(2));
}

describe('Cooperative Quorum and Weighted Voting Math', () => {
  it('correctly calculates 51% standard quorum on 100 total shares', () => {
    const quorum = calculateQuorumRequired(100, 51);
    expect(quorum).toBe(51);
  });

  it('correctly calculates 66% supermajority quorum with fractional rounding', () => {
    const quorum = calculateQuorumRequired(150, 66);
    expect(quorum).toBe(99);
  });

  it('determines quorum reached when votes meet or exceed required shares', () => {
    expect(isQuorumReached(51, 51)).toBe(true);
    expect(isQuorumReached(60, 51)).toBe(true);
    expect(isQuorumReached(50, 51)).toBe(false);
  });

  it('computes individual member voting power percentage accurately', () => {
    expect(calculateVotingPower(25, 100)).toBe(25.0);
    expect(calculateVotingPower(33, 100)).toBe(33.0);
    expect(calculateVotingPower(1, 3)).toBe(33.33);
    expect(calculateVotingPower(0, 100)).toBe(0.0);
    expect(calculateVotingPower(50, 0)).toBe(0.0);
  });

  it('handles edge case of zero or negative total shares gracefully', () => {
    expect(calculateQuorumRequired(0, 51)).toBe(0);
    expect(calculateQuorumRequired(-10, 51)).toBe(0);
    expect(calculateQuorumRequired(100, 0)).toBe(0);
  });
});
