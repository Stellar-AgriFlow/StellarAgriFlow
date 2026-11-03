import { describe, it, expect } from 'vitest';
import {
  InterestAccrualCalculator,
  LoanTerms,
} from '../packages/contracts-client/src/interestAccrual';

describe('Agricultural Loan Interest Accrual Calculator', () => {
  const baseTime = 1700000000;
  const oneDay = 86400;

  it('calculates linear simple interest accurately over full year duration', () => {
    const terms: LoanTerms = {
      principal: 10000,
      annualInterestRateBps: 1000, // 10.0%
      durationDays: 365,
      startDateTimestamp: baseTime,
    };

    const asOf = baseTime + 365 * oneDay;
    const result = InterestAccrualCalculator.calculateSimpleInterest(terms, asOf);

    expect(result.principal).toBe(10000);
    expect(result.baseInterest).toBe(1000);
    expect(result.forbearanceDiscount).toBe(0);
    expect(result.latePenalty).toBe(0);
    expect(result.totalPayoffAmount).toBe(11000);
    expect(result.effectiveDays).toBe(365);
  });

  it('applies climate forbearance discount correctly during drought distress', () => {
    const terms: LoanTerms = {
      principal: 10000,
      annualInterestRateBps: 1000, // 10%
      durationDays: 180,
      startDateTimestamp: baseTime,
      forbearanceDays: 30, // 30 days climate freeze
    };

    // Exactly 60 days elapsed
    const asOf = baseTime + 60 * oneDay;
    const result = InterestAccrualCalculator.calculateSimpleInterest(terms, asOf);

    // 60 elapsed - 30 forbearance = 30 effective days
    expect(result.effectiveDays).toBe(30);
    // Base interest on 30 days = 10,000 * 0.10 * (30/365) = 82
    expect(result.baseInterest).toBe(82);
    expect(result.forbearanceDiscount).toBe(82);
  });

  it('imposes late penalty when loan exceeds agreed duration', () => {
    const terms: LoanTerms = {
      principal: 10000,
      annualInterestRateBps: 1000, // 10%
      durationDays: 100,
      startDateTimestamp: baseTime,
      latePenaltyBps: 500, // 5% annual penalty
    };

    // 120 days elapsed (20 days overdue)
    const asOf = baseTime + 120 * oneDay;
    const result = InterestAccrualCalculator.calculateSimpleInterest(terms, asOf);

    expect(result.latePenalty).toBeGreaterThan(0);
    expect(result.totalAccruedInterest).toBe(result.baseInterest + result.latePenalty);
    expect(result.totalPayoffAmount).toBe(10000 + result.totalAccruedInterest);
  });

  it('computes compound interest accurately for multi-year agricultural credit', () => {
    // $10,000 at 10% compounded annually for 2 years -> 10000 * 1.1^2 = 12,100
    const compound = InterestAccrualCalculator.calculateCompoundInterest(10000, 1000, 1, 2);
    expect(compound).toBe(12100);
  });
});
