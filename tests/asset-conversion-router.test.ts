import { describe, it, expect } from 'vitest';
import { AssetConversionRouter, LiquidityPoolEdge } from '../packages/contracts-client/src/assetConversionRouter';

describe('AssetConversionRouter', () => {
  const pools: LiquidityPoolEdge[] = [
    {
      poolId: 'POOL_CROP_XLM',
      assetA: 'CROP',
      assetB: 'XLM',
      reserveA: 100_000,
      reserveB: 50_000,
      feeBps: 30, // 0.3%
    },
    {
      poolId: 'POOL_XLM_USDC',
      assetA: 'XLM',
      assetB: 'USDC',
      reserveA: 100_000,
      reserveB: 20_000,
      feeBps: 30,
    },
    {
      poolId: 'POOL_CROP_USDC_THIN',
      assetA: 'CROP',
      assetB: 'USDC',
      reserveA: 5_000, // very shallow liquidity -> high slippage
      reserveB: 500,
      feeBps: 30,
    },
  ];

  it('calculates single hop constant-product output with fee', () => {
    const res = AssetConversionRouter.calculateSingleHopOutput(100, 10_000, 10_000, 30);

    expect(res.outputAmount).toBeGreaterThan(98);
    expect(res.outputAmount).toBeLessThan(100);
    expect(res.priceImpactPercent).toBeGreaterThan(0);
  });

  it('finds superior multi-hop route when direct pool is thin', () => {
    // Swapping 500 CROP to USDC
    // Direct pool has only 500 USDC total, so high slippage
    // 2-hop via XLM has deep reserves (100k)
    const bestRoute = AssetConversionRouter.findBestRoute('CROP', 'USDC', 500, pools, 1.0);

    expect(bestRoute).not.toBeNull();
    expect(bestRoute?.hops.length).toBe(2);
    expect(bestRoute?.hops[0].fromAsset).toBe('CROP');
    expect(bestRoute?.hops[0].toAsset).toBe('XLM');
    expect(bestRoute?.hops[1].fromAsset).toBe('XLM');
    expect(bestRoute?.hops[1].toAsset).toBe('USDC');
    expect(bestRoute?.minOutputAmountWithSlippage).toBeLessThan(bestRoute!.expectedOutputAmount);
  });

  it('returns null if no path exists', () => {
    const route = AssetConversionRouter.findBestRoute('UNKN', 'USDC', 100, pools);
    expect(route).toBeNull();
  });
});
