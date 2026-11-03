'use client';

import React, { useState } from 'react';
import { X, ArrowUpRight, AlertTriangle } from 'lucide-react';

interface WithdrawSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (amount: number) => Promise<void>;
  stakedBalance: number;
}

export const WithdrawSavingsModal: React.FC<WithdrawSavingsModalProps> = ({
  isOpen,
  onClose,
  onWithdraw,
  stakedBalance,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePercentage = (pct: number) => {
    const calculated = (stakedBalance * pct) / 100;
    setAmount(calculated.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid withdrawal amount greater than zero.');
      return;
    }
    if (parsed > stakedBalance) {
      setError(`Withdrawal amount exceeds available staked savings of ${stakedBalance.toLocaleString()} USDC.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onWithdraw(parsed);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Withdraw Staked Savings</h2>
            <p className="text-xs text-slate-400">Cooperative treasury redemption</p>
          </div>
        </div>

        <div className="my-4 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300">
          Withdrawn funds are transferred directly to your connected Stellar wallet.
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
              <span className="text-slate-300 font-semibold">Withdrawal Amount</span>
              <span className="text-slate-400">
                Staked: <strong className="text-white">{stakedBalance.toLocaleString()} USDC</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                USDC
              </span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentage(pct)}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition"
              >
                {pct === 100 ? 'MAX' : `${pct}%`}
              </button>
            ))}
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
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              {isSubmitting ? 'Processing...' : 'Withdraw Capital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
