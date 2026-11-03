'use client';

import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Smartphone, Building2, AlertCircle } from 'lucide-react';
import { SUPPORTED_FIAT_CURRENCIES, SupportedFiatCurrency } from '../../services/anchorClient';

interface Sep24FiatRampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiateRamp: (params: {
    mode: 'deposit' | 'withdraw';
    assetCode: string;
    amount: string;
  }) => Promise<{ url?: string; id?: string }>;
}

export const Sep24FiatRampModal: React.FC<Sep24FiatRampModalProps> = ({
  isOpen,
  onClose,
  onInitiateRamp,
}) => {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedFiatCurrency>(
    SUPPORTED_FIAT_CURRENCIES[0]
  );
  const [amount, setAmount] = useState('50000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (isNaN(val) || val < selectedCurrency.minAmount) {
      setError(`Minimum transaction amount is ${selectedCurrency.symbol}${selectedCurrency.minAmount}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await onInitiateRamp({
        mode,
        assetCode: selectedCurrency.code,
        amount,
      });

      if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate anchor session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            {mode === 'deposit' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {mode === 'deposit' ? 'Local Fiat Deposit' : 'Local Fiat Cashout'}
            </h3>
            <p className="text-xs text-slate-400">Bank transfer & Mobile Money bridge (SEP-24)</p>
          </div>
        </div>

        <div className="flex border-b border-slate-800 mb-4">
          <button
            onClick={() => setMode('deposit')}
            className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-all ${
              mode === 'deposit' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400'
            }`}
          >
            Deposit (Buy USDC)
          </button>
          <button
            onClick={() => setMode('withdraw')}
            className={`pb-2 px-4 text-xs font-semibold border-b-2 transition-all ${
              mode === 'withdraw' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400'
            }`}
          >
            Withdraw (Cash Out)
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Select Currency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_FIAT_CURRENCIES.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => setSelectedCurrency(c)}
                  className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedCurrency.code === c.code
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold">{c.code}</span> ({c.symbol})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Amount ({selectedCurrency.code})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              placeholder={`${selectedCurrency.minAmount}`}
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Min: {selectedCurrency.symbol}{selectedCurrency.minAmount.toLocaleString()} · Max: {selectedCurrency.symbol}{selectedCurrency.maxAmount.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-300">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Supports M-Pesa, MTN MoMo, Airtel, and Direct Bank Transfer</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-200"
          >
            {loading ? 'Launching Secure Anchor...' : `Proceed with ${selectedCurrency.code} ${mode}`}
          </button>
        </form>
      </div>
    </div>
  );
};
