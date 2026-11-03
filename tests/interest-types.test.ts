import { describe, it, expect } from 'vitest';
import {
  generateBulletAmortization,
  AmortizationSchedule,
} from '../packages/types/src/interest';

describe('Loan Amortization Schedule & Allocation Generator', () => {
  const baseTime = 1700000000;

  it('generates accurate seasonal bullet loan amortization schedule', () => {
    const schedule: AmortizationSchedule = generateBulletAmortization(
      101,
      'GDFARMER_KENYA',
      5000,
      1200, // 12%
      180, // 180 days
      baseTime
    );

    expect(schedule.loanId).toBe(101);
    expect(schedule.borrower).toBe('GDFARMER_KENYA');
    expect(schedule.totalPrincipal).toBe(5000);
    // 5000 * 0.12 * (180/365) = 295.89 -> 296
    expect(schedule.totalInterest).toBe(296);
    expect(schedule.totalPayable).toBe(5296);
    expect(schedule.frequency).toBe('Bullet');
    expect(schedule.installments.length).toBe(1);

    const first = schedule.installments[0];
    expect(first.installmentNumber).toBe(1);
    expect(first.principalDue).toBe(5000);
    expect(first.interestDue).toBe(296);
    expect(first.totalPayment).toBe(5296);
    expect(first.dueDateTimestamp).toBe(baseTime + 180 * 86400);
    expect(first.remainingBalance).toBe(0);
  });
});
