export interface LiquidityPoolEdge {
  poolId: string;
  assetA: string;
  assetB: string;
  reserveA: number;
  reserveB: number;
  feeBps: number; // e.g. 30 = 0.3%
}

export interface RoutingHop {
  fromAsset: string;
  toAsset: string;
  poolId: string;
  inputAmount: number;
  outputAmount: number;
}

export interface OptimizedConversionRoute {
  sourceAsset: string;
  targetAsset: string;
  inputAmount: number;
  expectedOutputAmount: number;
  minOutputAmountWithSlippage: number;
  hops: RoutingHop[];
  priceImpactPercent: number;
  effectiveExchangeRate: number;
}

export class AssetConversionRouter {
  /**
   * Calculates output amount from single pool constant product invariant (x * y = k)
   */
  public static calculateSingleHopOutput(
    inputAmount: number,
    inputReserve: number,
    outputReserve: number,
    feeBps: number = 30
  ): { outputAmount: number; priceImpactPercent: number } {
    if (inputAmount <= 0 || inputReserve <= 0 || outputReserve <= 0) {
      return { outputAmount: 0, priceImpactPercent: 0 };
    }

    const inputWithFee = inputAmount * (10000 - feeBps);
    const numerator = inputWithFee * outputReserve;
    const denominator = inputReserve * 10000 + inputWithFee;
    const outputAmount = Number((numerator / denominator).toFixed(6));

    // Spot price before trade = outputReserve / inputReserve
    const spotPrice = outputReserve / inputReserve;
    // Effective execution price = outputAmount / inputAmount
    const executionPrice = outputAmount / inputAmount;
    const priceImpactPercent = Math.max(
      0,
      Number((((spotPrice - executionPrice) / spotPrice) * 100).toFixed(2))
    );

    return { outputAmount, priceImpactPercent };
  }

  /**
   * Finds the best route between direct swap and 2-hop intermediary path
   */
  public static findBestRoute(
    sourceAsset: string,
    targetAsset: string,
    inputAmount: number,
    pools: LiquidityPoolEdge[],
    slippageTolerancePercent: number = 1.0
  ): OptimizedConversionRoute | null {
    if (sourceAsset === targetAsset || inputAmount <= 0) return null;

    let bestRoute: OptimizedConversionRoute | null = null;
    let maxOutput = 0;

    // 1. Direct pool lookup
    const directPool = pools.find(
      (p) =>
        (p.assetA === sourceAsset && p.assetB === targetAsset) ||
        (p.assetB === sourceAsset && p.assetA === targetAsset)
    );

    if (directPool) {
      const isAtoB = directPool.assetA === sourceAsset;
      const inReserve = isAtoB ? directPool.reserveA : directPool.reserveB;
      const outReserve = isAtoB ? directPool.reserveB : directPool.reserveA;

      const { outputAmount, priceImpactPercent } = this.calculateSingleHopOutput(
        inputAmount,
        inReserve,
        outReserve,
        directPool.feeBps
      );

      if (outputAmount > 0) {
        const minOut = Number((outputAmount * (1 - slippageTolerancePercent / 100)).toFixed(6));
        bestRoute = {
          sourceAsset,
          targetAsset,
          inputAmount,
          expectedOutputAmount: outputAmount,
          minOutputAmountWithSlippage: minOut,
          hops: [
            {
              fromAsset: sourceAsset,
              toAsset: targetAsset,
              poolId: directPool.poolId,
              inputAmount,
              outputAmount,
            },
          ],
          priceImpactPercent,
          effectiveExchangeRate: Number((outputAmount / inputAmount).toFixed(6)),
        };
        maxOutput = outputAmount;
      }
    }

    // 2. 2-Hop intermediate pools (e.g. CROP -> XLM -> USDC)
    const intermediateAssets = new Set<string>();
    pools.forEach((p) => {
      if (p.assetA !== sourceAsset && p.assetA !== targetAsset) intermediateAssets.add(p.assetA);
      if (p.assetB !== sourceAsset && p.assetB !== targetAsset) intermediateAssets.add(p.assetB);
    });

    for (const intermediate of intermediateAssets) {
      const leg1Pool = pools.find(
        (p) =>
          (p.assetA === sourceAsset && p.assetB === intermediate) ||
          (p.assetB === sourceAsset && p.assetA === intermediate)
      );
      const leg2Pool = pools.find(
        (p) =>
          (p.assetA === intermediate && p.assetB === targetAsset) ||
          (p.assetB === intermediate && p.assetA === targetAsset)
      );

      if (leg1Pool && leg2Pool) {
        const leg1IsA = leg1Pool.assetA === sourceAsset;
        const leg1ResIn = leg1IsA ? leg1Pool.reserveA : leg1Pool.reserveB;
        const leg1ResOut = leg1IsA ? leg1Pool.reserveB : leg1Pool.reserveA;
        const leg1Res = this.calculateSingleHopOutput(
          inputAmount,
          leg1ResIn,
          leg1ResOut,
          leg1Pool.feeBps
        );

        if (leg1Res.outputAmount > 0) {
          const leg2IsA = leg2Pool.assetA === intermediate;
          const leg2ResIn = leg2IsA ? leg2Pool.reserveA : leg2Pool.reserveB;
          const leg2ResOut = leg2IsA ? leg2Pool.reserveB : leg2Pool.reserveA;
          const leg2Res = this.calculateSingleHopOutput(
            leg1Res.outputAmount,
            leg2ResIn,
            leg2ResOut,
            leg2Pool.feeBps
          );

          if (leg2Res.outputAmount > maxOutput) {
            maxOutput = leg2Res.outputAmount;
            const combinedImpact = Number(
              (leg1Res.priceImpactPercent + leg2Res.priceImpactPercent).toFixed(2)
            );
            const minOut = Number(
              (leg2Res.outputAmount * (1 - slippageTolerancePercent / 100)).toFixed(6)
            );

            bestRoute = {
              sourceAsset,
              targetAsset,
              inputAmount,
              expectedOutputAmount: leg2Res.outputAmount,
              minOutputAmountWithSlippage: minOut,
              hops: [
                {
                  fromAsset: sourceAsset,
                  toAsset: intermediate,
                  poolId: leg1Pool.poolId,
                  inputAmount,
                  outputAmount: leg1Res.outputAmount,
                },
                {
                  fromAsset: intermediate,
                  toAsset: targetAsset,
                  poolId: leg2Pool.poolId,
                  inputAmount: leg1Res.outputAmount,
                  outputAmount: leg2Res.outputAmount,
                },
              ],
              priceImpactPercent: combinedImpact,
              effectiveExchangeRate: Number((leg2Res.outputAmount / inputAmount).toFixed(6)),
            };
          }
        }
      }
    }

    return bestRoute;
  }
}
