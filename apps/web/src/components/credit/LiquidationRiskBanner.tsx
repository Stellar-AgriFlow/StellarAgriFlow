'use client';

import React from 'react';
import { AlertTriangle, AlertOctagon, ArrowRight } from 'lucide-react';
import { LiquidationHealth } from '../../services/liquidationCalculator';

interface LiquidationRiskBannerProps {
  health: LiquidationHealth;
  onTopUpCollateral?: () => void;
  onPartialRepay?: () => void;
}

export const LiquidationRiskBanner: React.FC<LiquidationRiskBannerProps> = ({
  health,
  onTopUpCollateral,
  onPartialRepay,
}) => {
  if (!health.isMarginCall && !health.isLiquidatable) {
    return null;
  }

  const isSevere = health.isLiquidatable;

  return (
    <div
      className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
        isSevere
          ? 'bg-red-950/40 border-red-500/50 text-red-200'
          : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-xl mt-0.5 ${
            isSevere ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {isSevere ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">
            {isSevere
              ? `Liquidation Warning: Loan #${health.loanId} at ${health.currentLtvPercent}% LTV`
              : `Margin Call Notice: Loan #${health.loanId} at ${health.currentLtvPercent}% LTV`}
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            {isSevere
              ? `Collateral value dropped to $${health.currentCollateralValueUsd}. Position may be auctioned. Deficit: $${health.shortfallUsd}`
              : `Collateral threshold exceeded due to commodity price fluctuations. Please deposit additional grain receipts or repay principal.`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {onTopUpCollateral && (
          <button
            onClick={onTopUpCollateral}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors ${
              isSevere ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            Deposit Collateral
          </button>
        )}
        {onPartialRepay && (
          <button
            onClick={onPartialRepay}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Partial Repayment
          </button>
        )}
      </div>
    </div>
  );
};
