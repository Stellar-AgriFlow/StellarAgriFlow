'use client';

import React, { useState } from 'react';
import { Coins, ArrowDownRight, ArrowUpRight, Shield, Info } from 'lucide-react';
import { LiquidityPoolStatus } from '@agriflow/types';

interface LiquidityPoolWidgetProps {
  status: LiquidityPoolStatus;
  onDeposit: (amountUsd: number) => Promise<void>;
  onWithdraw: (sharesToBurn: number) => Promise<void>;
}

export const LiquidityPoolWidget: React.FC<LiquidityPoolWidgetProps> = ({
  status,
  onDeposit,
  onWithdraw,
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSolvencyRatio =
    status.totalDeposited > 0
      ? Math.round(((status.totalDeposited - status.totalReserved) / status.totalDeposited) * 100)
      : 100;

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'deposit') {
        await onDeposit(val);
      } else {
        await onWithdraw(val);
      }
    } catch (err: any) {
      setError(err?.message || 'Transaction failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Parametric Reinsurance Liquidity Pool</h3>
            <p className="text-xs text-slate-400">Provide risk capital to earn underwriting premium yield</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Value Locked (TVL)</span>
          <span className="text-lg font-bold text-white">${status.totalDeposited.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Reserved Policy Liability</span>
          <span className="text-lg font-bold text-amber-400">${status.totalReserved.toLocaleString()}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Unreserved Solvency</span>
          <span className="text-lg font-bold text-emerald-400">{availableSolvencyRatio}%</span>
        </div>
      </div>

      <div className="flex border-b border-slate-800 mb-4">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'deposit'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>Deposit Capital</span>
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'withdraw'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Withdraw Liquidity</span>
        </button>
      </div>

      {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 text-red-300 text-xs">{error}</div>}

      <form onSubmit={handleAction} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            {activeTab === 'deposit' ? 'Deposit Amount ($ USDC)' : 'LP Shares to Burn'}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
            placeholder="500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-purple-900/30 transition-all duration-200"
        >
          {loading
            ? 'Processing on Soroban...'
            : activeTab === 'deposit'
            ? 'Deposit USDC & Mint LP Shares'
            : 'Burn LP Shares & Withdraw USDC'}
        </button>
      </form>
    </div>
  );
};
