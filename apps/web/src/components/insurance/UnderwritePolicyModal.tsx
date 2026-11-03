'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Sun, CloudRain, AlertCircle } from 'lucide-react';
import { RiskType } from '@agriflow/types';

interface UnderwritePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnderwrite: (params: {
    riskType: RiskType;
    triggerThreshold: number;
    payoutAmountUsd: number;
    durationDays: number;
  }) => Promise<void>;
}

export const UnderwritePolicyModal: React.FC<UnderwritePolicyModalProps> = ({
  isOpen,
  onClose,
  onUnderwrite,
}) => {
  const [riskType, setRiskType] = useState<RiskType>('Drought');
  const [payoutAmount, setPayoutAmount] = useState('2000');
  const [triggerThreshold, setTriggerThreshold] = useState('40'); // Drought index > 40
  const [durationDays, setDurationDays] = useState('90');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const coverage = Number(payoutAmount);
  const premium = Math.round(coverage * 0.05); // 5% fixed premium

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(coverage) || coverage <= 0) {
      setError('Please provide a valid coverage payout amount.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onUnderwrite({
        riskType,
        triggerThreshold: Number(triggerThreshold),
        payoutAmountUsd: coverage,
        durationDays: Number(durationDays),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to underwrite policy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Underwrite Parametric Insurance</h3>
            <p className="text-xs text-slate-400">Automated oracle-triggered climate disaster protection</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Peril / Risk Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRiskType('Drought');
                  setTriggerThreshold('40');
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  riskType === 'Drought'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Severe Drought</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRiskType('Flood');
                  setTriggerThreshold('150');
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  riskType === 'Flood'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CloudRain className="w-4 h-4" />
                <span>Excess Rainfall / Flood</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Desired Payout ($ USDC)
              </label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="2000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Coverage Duration (Days)
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="30">30 Days (Germination)</option>
                <option value="90">90 Days (Full Season)</option>
                <option value="180">180 Days (Two Seasons)</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Oracle Trigger Threshold:</span>
              <span className="font-semibold text-white">
                {riskType === 'Drought' ? `Drought Index ≥ ${triggerThreshold}` : `Rainfall ≥ ${triggerThreshold} mm`}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Policy Premium (5% fixed):</span>
              <span className="font-bold text-emerald-400">${premium} USDC</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-blue-900/30 transition-all duration-200"
          >
            {loading ? <span>Underwriting on Soroban...</span> : <span>Confirm & Pay Premium (${premium})</span>}
          </button>
        </form>
      </div>
    </div>
  );
};
