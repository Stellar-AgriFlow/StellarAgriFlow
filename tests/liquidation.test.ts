import { describe, it, expect } from 'vitest';
import { LiquidationCalculator } from '../apps/web/src/services/liquidationCalculator';

describe('Collateral Margin Call & Liquidation Calculator', () => {
  const healthyPosition = {
    loanId: 101,
    borrowedAmountUsd: 7000,
    collateralQuantityKg: 20000, // 20 MT
    commoditySymbol: 'WHEAT',
    maxLtvPercent: 70, // 70% threshold for margin call
    liquidationThresholdPercent: 85, // 85% threshold for liquidation auction
  };

  it('marks loan as fully healthy when collateral value exceeds borrow amount comfortably', () => {
    // Wheat at $0.60/kg => 20,000 * 0.60 = $12,000 collateral
    // LTV = 7,000 / 12,000 = ~58.33%
    const health = LiquidationCalculator.evaluateHealth(healthyPosition, 0.6);

    expect(health.currentCollateralValueUsd).toBe(12000);
    expect(health.currentLtvPercent).toBe(58.33);
    expect(health.isMarginCall).toBe(false);
    expect(health.isLiquidatable).toBe(false);
    expect(health.shortfallUsd).toBe(0);
  });

  it('flags margin call warning when LTV crosses maxLtvPercent (70%)', () => {
    // Wheat price drops to $0.45/kg => 20,000 * 0.45 = $9,000 collateral
    // LTV = 7,000 / 9,000 = ~77.78% (above 70% but below 85%)
    const health = LiquidationCalculator.evaluateHealth(healthyPosition, 0.45);

    expect(health.currentLtvPercent).toBe(77.78);
    expect(health.isMarginCall).toBe(true);
    expect(health.isLiquidatable).toBe(false);
  });

  it('triggers liquidation auction when price collapse pushes LTV beyond 85%', () => {
    // Wheat price drops to $0.35/kg => 20,000 * 0.35 = $7,000 collateral
    // LTV = 7,000 / 7,000 = 100% (well above 85%)
    const health = LiquidationCalculator.evaluateHealth(healthyPosition, 0.35);

    expect(health.currentLtvPercent).toBe(100);
    expect(health.isMarginCall).toBe(true);
    expect(health.isLiquidatable).toBe(true);
    expect(health.shortfallUsd).toBeGreaterThan(0);
  });
});
