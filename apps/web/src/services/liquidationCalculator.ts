export interface CollateralPosition {
  loanId: number;
  borrowedAmountUsd: number;
  collateralQuantityKg: number;
  commoditySymbol: string;
  maxLtvPercent: number; // e.g. 70%
  liquidationThresholdPercent: number; // e.g. 85%
}

export interface LiquidationHealth {
  loanId: number;
  currentCollateralValueUsd: number;
  currentLtvPercent: number;
  isMarginCall: boolean;
  isLiquidatable: boolean;
  shortfallUsd: number;
}

export class LiquidationCalculator {
  /**
   * Calculates real-time liquidation risk for an agricultural collateralized loan
   */
  static evaluateHealth(
    position: CollateralPosition,
    oraclePriceUsdPerKg: number
  ): LiquidationHealth {
    const collateralValue = position.collateralQuantityKg * oraclePriceUsdPerKg;

    if (collateralValue <= 0) {
      return {
        loanId: position.loanId,
        currentCollateralValueUsd: 0,
        currentLtvPercent: 999,
        isMarginCall: true,
        isLiquidatable: true,
        shortfallUsd: position.borrowedAmountUsd,
      };
    }

    const currentLtv = (position.borrowedAmountUsd / collateralValue) * 100;
    const isMarginCall = currentLtv >= position.maxLtvPercent;
    const isLiquidatable = currentLtv >= position.liquidationThresholdPercent;

    const minimumRequiredCollateral =
      position.borrowedAmountUsd / (position.liquidationThresholdPercent / 100);
    const shortfallUsd = isLiquidatable
      ? Math.max(0, minimumRequiredCollateral - collateralValue)
      : 0;

    return {
      loanId: position.loanId,
      currentCollateralValueUsd: Math.round(collateralValue * 100) / 100,
      currentLtvPercent: Math.round(currentLtv * 100) / 100,
      isMarginCall,
      isLiquidatable,
      shortfallUsd: Math.round(shortfallUsd * 100) / 100,
    };
  }
}
