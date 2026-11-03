import { describe, it, expect } from 'vitest';

export function distributeAuctionProceeds(
  settlementPrice: number,
  debtAmount: number
): {
  debtRecovered: number;
  surplusRefund: number;
  isFullyRepaid: boolean;
  shortfall: number;
} {
  const debtRecovered = Math.min(settlementPrice, debtAmount);
  const surplusRefund = Math.max(0, settlementPrice - debtAmount);
  const shortfall = Math.max(0, debtAmount - settlementPrice);

  return {
    debtRecovered,
    surplusRefund,
    isFullyRepaid: shortfall === 0,
    shortfall,
  };
}

describe('Collateral Debt Recovery & Surplus Refund Distribution', () => {
  it('distributes proceeds with full debt recovery and surplus refund when price exceeds loan debt', () => {
    // Auction sells at $9,500, outstanding debt is $7,000
    const result = distributeAuctionProceeds(9500, 7000);

    expect(result.debtRecovered).toBe(7000);
    expect(result.surplusRefund).toBe(2500); // $2,500 refunded to borrower
    expect(result.isFullyRepaid).toBe(true);
    expect(result.shortfall).toBe(0);
  });

  it('calculates shortfall when collateral sells below outstanding debt at reserve floor', () => {
    // Auction hits reserve floor at $5,000, debt is $6,500
    const result = distributeAuctionProceeds(5000, 6500);

    expect(result.debtRecovered).toBe(5000);
    expect(result.surplusRefund).toBe(0);
    expect(result.isFullyRepaid).toBe(false);
    expect(result.shortfall).toBe(1500);
  });

  it('handles exact debt amount match with zero surplus and zero shortfall', () => {
    const result = distributeAuctionProceeds(4000, 4000);

    expect(result.debtRecovered).toBe(4000);
    expect(result.surplusRefund).toBe(0);
    expect(result.isFullyRepaid).toBe(true);
    expect(result.shortfall).toBe(0);
  });
});
