export interface LoanTerms {
  principal: number;
  annualInterestRateBps: number; // e.g. 850 = 8.5%
  durationDays: number;
  startDateTimestamp: number;
  forbearanceDays?: number; // Days during climate distress where interest is frozen
  latePenaltyBps?: number; // e.g. 200 = 2.0%
}

export interface InterestAccrualResult {
  principal: number;
  baseInterest: number;
  forbearanceDiscount: number;
  latePenalty: number;
  totalAccruedInterest: number;
  totalPayoffAmount: number;
  dailyInterestRate: number;
  effectiveDays: number;
}

export class InterestAccrualCalculator {
  /**
   * Computes simple linear interest for agricultural micro-loans
   */
  static calculateSimpleInterest(
    terms: LoanTerms,
    asOfTimestamp: number = Math.floor(Date.now() / 1000)
  ): InterestAccrualResult {
    const elapsedSeconds = Math.max(0, asOfTimestamp - terms.startDateTimestamp);
    const elapsedDays = Math.floor(elapsedSeconds / 86400);

    const forbearanceDays = Math.min(elapsedDays, terms.forbearanceDays || 0);
    const effectiveDays = Math.max(0, elapsedDays - forbearanceDays);

    const annualRate = terms.annualInterestRateBps / 10000;
    const dailyRate = annualRate / 365;

    const baseInterest = Math.round(terms.principal * dailyRate * effectiveDays);

    // Calculate late penalty if past loan duration
    let latePenalty = 0;
    if (elapsedDays > terms.durationDays && terms.latePenaltyBps) {
      const overdueDays = elapsedDays - terms.durationDays;
      const penaltyRate = (terms.latePenaltyBps / 10000) / 365;
      latePenalty = Math.round(terms.principal * penaltyRate * overdueDays);
    }

    const forbearanceDiscount = Math.round(terms.principal * dailyRate * forbearanceDays);
    const totalAccruedInterest = baseInterest + latePenalty;
    const totalPayoffAmount = terms.principal + totalAccruedInterest;

    return {
      principal: terms.principal,
      baseInterest,
      forbearanceDiscount,
      latePenalty,
      totalAccruedInterest,
      totalPayoffAmount,
      dailyInterestRate: Number(dailyRate.toFixed(6)),
      effectiveDays,
    };
  }

  /**
   * Computes compound interest for seasonal financing
   */
  static calculateCompoundInterest(
    principal: number,
    annualRateBps: number,
    compoundingPeriodsPerYear: number,
    years: number
  ): number {
    if (principal <= 0 || years <= 0) return principal;
    const r = annualRateBps / 10000;
    const n = compoundingPeriodsPerYear;
    const amount = principal * Math.pow(1 + r / n, n * years);
    return Math.round(amount);
  }
}
