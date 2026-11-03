export interface FarmerScoringInput {
  successfulLoansRepaid: number;
  totalLoansTaken: number;
  defaultsCount: number;
  escrowsCompleted: number;
  disputesLost: number;
  hasCertifiedPassport: boolean;
  yearsActive: number;
}

export interface CreditScoreResult {
  score: number; // 300 to 850 (FICO equivalent range)
  tier: 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  recommendedInterestDiscountBps: number;
  maxUncollateralizedCreditUsd: number;
}

export class CreditScoringEngine {
  /**
   * Computes objective on-chain credit score based on historical farming activity
   */
  static calculateCreditScore(input: FarmerScoringInput): CreditScoreResult {
    // Base score starts at 500
    let score = 500;

    // Repayment ratio bonus
    if (input.totalLoansTaken > 0) {
      const repaymentRate = input.successfulLoansRepaid / input.totalLoansTaken;
      score += Math.round(repaymentRate * 150);
    }

    // Default penalty
    score -= input.defaultsCount * 120;

    // Trade escrow volume bonus
    score += Math.min(input.escrowsCompleted * 10, 100);

    // Dispute fault deduction
    score -= input.disputesLost * 50;

    // Certified farm passport bonus
    if (input.hasCertifiedPassport) {
      score += 50;
    }

    // Longevity bonus
    score += Math.min(input.yearsActive * 15, 60);

    // Clamp score between 300 and 850
    score = Math.max(300, Math.min(850, score));

    // Determine tier and lending benefits
    let tier: CreditScoreResult['tier'] = 'Bronze';
    let discountBps = 0;
    let maxCredit = 500;

    if (score >= 800) {
      tier = 'Diamond';
      discountBps = 250; // 2.5% discount
      maxCredit = 25000;
    } else if (score >= 740) {
      tier = 'Platinum';
      discountBps = 175;
      maxCredit = 15000;
    } else if (score >= 670) {
      tier = 'Gold';
      discountBps = 100;
      maxCredit = 7500;
    } else if (score >= 580) {
      tier = 'Silver';
      discountBps = 50;
      maxCredit = 2500;
    }

    return {
      score,
      tier,
      recommendedInterestDiscountBps: discountBps,
      maxUncollateralizedCreditUsd: maxCredit,
    };
  }
}
