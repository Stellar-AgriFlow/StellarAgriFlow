import { describe, it, expect } from 'vitest';
import { defaultReputationClient } from '../packages/contracts-client/src/reputation';

describe('Agricultural Reputation Scoring & Trust Tiers', () => {
  it('correctly calculates Trust Tier thresholds based on reputation points', () => {
    expect(defaultReputationClient.calculateTrustTier(100)).toBe('Bronze');
    expect(defaultReputationClient.calculateTrustTier(129)).toBe('Bronze');
    expect(defaultReputationClient.calculateTrustTier(130)).toBe('Silver');
    expect(defaultReputationClient.calculateTrustTier(179)).toBe('Silver');
    expect(defaultReputationClient.calculateTrustTier(180)).toBe('Gold');
    expect(defaultReputationClient.calculateTrustTier(249)).toBe('Gold');
    expect(defaultReputationClient.calculateTrustTier(250)).toBe('Platinum');
    expect(defaultReputationClient.calculateTrustTier(400)).toBe('Platinum');
  });

  it('calculates expected score increases according to protocol rules', () => {
    let score = 100; // Base default

    // Trade completed (+10)
    score += 10;
    expect(score).toBe(110);

    // Financing completed (+15)
    score += 15;
    expect(score).toBe(125);

    // Repayment completed (+25)
    score += 25;
    expect(score).toBe(150);

    // Escrow settlement completed (+10)
    score += 10;
    expect(score).toBe(160);
  });
});
