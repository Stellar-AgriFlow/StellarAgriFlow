'use client';

import React, { useState } from 'react';
import { X, Gift, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DividendDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDistribute: (totalPool: number) => Promise<void>;
  treasuryBalance: number;
}

export const DividendDistributionModal: React.FC<DividendDistributionModalProps> = ({
  isOpen,
  onClose,
  onDistribute,
  treasuryBalance,
}) => {
  const [poolAmount, setPoolAmount] = useState<string>('5000');
  const [isDistributing, setIsDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(poolAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid distribution pool amount greater than zero.');
      return;
    }
    if (parsed > treasuryBalance) {
      setError(`Dividend pool exceeds available treasury balance of ${treasuryBalance.toLocaleString()} USDC.`);
      return;
    }

    try {
      setIsDistributing(true);
      await onDistribute(parsed);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Distribution failed.';
      setError(message);
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Distribute Seasonal Surplus Dividends</h2>
            <p className="text-xs text-slate-400">Proportional rebate to all cooperative member stakers</p>
          </div>
        </div>

        <div className="my-4 p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-xs text-amber-300">
          Dividends are automatically apportioned based on each farmer&apos;s staked savings and disbursed in batch multi-op Stellar transactions.
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-slate-300 font-semibold">Total Dividend Pool (USDC)</span>
              <span className="text-slate-400">
                Treasury: <strong className="text-white">{treasuryBalance.toLocaleString()} USDC</strong>
              </span>
            </div>
            <input
              type="number"
              step="any"
              value={poolAmount}
              onChange={(e) => setPoolAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Recipients</span>
              <span className="font-semibold text-white">All Active Stakers (100 Shares)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Stellar Execution</span>
              <span className="font-semibold text-emerald-400">Atomic Multi-Op Batch</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Network Base Fee</span>
              <span className="font-mono text-white">~0.0001 XLM (100 stroops/op)</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDistributing}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isDistributing ? 'Disbursing Batch...' : 'Disburse Dividends'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
