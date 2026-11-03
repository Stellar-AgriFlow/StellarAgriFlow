import { describe, it, expect } from 'vitest';
import { CreditScoringEngine } from '../apps/web/src/services/creditScoringEngine';

describe('Farmer On-Chain Credit Scoring Engine', () => {
  it('awards Diamond tier for pristine repayment record and certified farm passport', () => {
    const result = CreditScoringEngine.calculateCreditScore({
      successfulLoansRepaid: 10,
      totalLoansTaken: 10,
      defaultsCount: 0,
      escrowsCompleted: 20,
      disputesLost: 0,
      hasCertifiedPassport: true,
      yearsActive: 4,
    });

    expect(result.score).toBeGreaterThanOrEqual(800);
    expect(result.tier).toBe('Diamond');
    expect(result.recommendedInterestDiscountBps).toBe(250);
    expect(result.maxUncollateralizedCreditUsd).toBe(25000);
  });

  it('heavily penalizes default occurrences and downgrades to Bronze tier', () => {
    const result = CreditScoringEngine.calculateCreditScore({
      successfulLoansRepaid: 2,
      totalLoansTaken: 5,
      defaultsCount: 3,
      escrowsCompleted: 1,
      disputesLost: 2,
      hasCertifiedPassport: false,
      yearsActive: 1,
    });

    expect(result.score).toBeLessThan(580);
    expect(result.tier).toBe('Bronze');
    expect(result.recommendedInterestDiscountBps).toBe(0);
    expect(result.maxUncollateralizedCreditUsd).toBe(500);
  });

  it('correctly categorizes Gold and Silver intermediate tiers', () => {
    const silverFarmer = CreditScoringEngine.calculateCreditScore({
      successfulLoansRepaid: 4,
      totalLoansTaken: 5,
      defaultsCount: 0,
      escrowsCompleted: 5,
      disputesLost: 0,
      hasCertifiedPassport: false,
      yearsActive: 1,
    });
    expect(['Silver', 'Gold']).toContain(silverFarmer.tier);
    expect(silverFarmer.recommendedInterestDiscountBps).toBeGreaterThan(0);
  });
});
