import { describe, it, expect } from 'vitest';
import { LiquidityPoolCalculator } from '../packages/contracts-client/src/liquidityPoolCalc';

describe('LiquidityPoolCalculator AMM Invariants', () => {
  it('computes accurate AMM swap output with 0.30% fee and price impact', () => {
    // 100,000 XLM and 100,000 USDC pool
    const quote = LiquidityPoolCalculator.quoteSwap(
      100000,
      100000,
      1000, // Swap 1,000 XLM
      0.5 // 0.5% slippage
    );

    expect(quote.spotPrice).toBe(1);
    expect(quote.amountOut).toBeGreaterThan(980);
    expect(quote.amountOut).toBeLessThan(1000);
    expect(quote.priceImpactPercent).toBeGreaterThan(0.5);
    expect(quote.priceImpactPercent).toBeLessThan(1.5);
    expect(quote.minAmountOut).toBeLessThan(quote.amountOut);
    expect(quote.feeAmount).toBe(3); // 0.3% of 1000 = 3
  });

  it('calculates balanced deposit amounts without introducing arbitrage slippage', () => {
    // 200,000 XLM and 50,000 USDC pool (1 USDC = 4 XLM)
    const requiredUsdc = LiquidityPoolCalculator.quoteDeposit(
      200000,
      50000,
      4000 // 4,000 XLM deposited
    );
    expect(requiredUsdc).toBe(1000);
  });

  it('handles zero or negative inputs gracefully', () => {
    const zeroQuote = LiquidityPoolCalculator.quoteSwap(0, 100000, 100);
    expect(zeroQuote.amountOut).toBe(0);

    const zeroDeposit = LiquidityPoolCalculator.quoteDeposit(0, 50000, 100);
    expect(zeroDeposit).toBe(0);
  });
});
