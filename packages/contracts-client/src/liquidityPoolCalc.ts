export interface SwapQuote {
  amountIn: number;
  amountOut: number;
  minAmountOut: number;
  spotPrice: number;
  executionPrice: number;
  priceImpactPercent: number;
  feeAmount: number;
}

export class LiquidityPoolCalculator {
  public static readonly STELLAR_NATIVE_LP_FEE_BPS = 30; // 0.30% standard Stellar fee

  /**
   * Computes constant product AMM swap output following Stellar protocol rules
   */
  static quoteSwap(
    reserveIn: number,
    reserveOut: number,
    amountIn: number,
    slippageTolerancePercent: number = 0.5,
    feeBps: number = LiquidityPoolCalculator.STELLAR_NATIVE_LP_FEE_BPS
  ): SwapQuote {
    if (reserveIn <= 0 || reserveOut <= 0 || amountIn <= 0) {
      return {
        amountIn,
        amountOut: 0,
        minAmountOut: 0,
        spotPrice: 0,
        executionPrice: 0,
        priceImpactPercent: 0,
        feeAmount: 0,
      };
    }

    const spotPrice = reserveOut / reserveIn;
    const feeMultiplier = 10000 - feeBps;
    const amountInWithFee = amountIn * feeMultiplier;
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 10000 + amountInWithFee;

    const amountOut = numerator / denominator;
    const executionPrice = amountOut / amountIn;

    const priceImpactPercent = ((spotPrice - executionPrice) / spotPrice) * 100;
    const minAmountOut = amountOut * (1 - slippageTolerancePercent / 100);
    const feeAmount = (amountIn * feeBps) / 10000;

    return {
      amountIn,
      amountOut: Number(amountOut.toFixed(6)),
      minAmountOut: Number(minAmountOut.toFixed(6)),
      spotPrice: Number(spotPrice.toFixed(6)),
      executionPrice: Number(executionPrice.toFixed(6)),
      priceImpactPercent: Number(Math.max(0, priceImpactPercent).toFixed(2)),
      feeAmount: Number(feeAmount.toFixed(6)),
    };
  }

  /**
   * Calculates required deposit amount of Asset B to match Asset A in LP without price deviation
   */
  static quoteDeposit(
    reserveA: number,
    reserveB: number,
    amountA: number
  ): number {
    if (reserveA <= 0 || reserveB <= 0 || amountA <= 0) return 0;
    return Number(((amountA * reserveB) / reserveA).toFixed(6));
  }
}
