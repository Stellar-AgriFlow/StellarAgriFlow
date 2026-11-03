'use client';

import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { WarehouseReceipt } from '@agriflow/types';

interface ReceiptPledgeModalProps {
  isOpen: boolean;
  receipt: WarehouseReceipt | null;
  onClose: () => void;
  onPledge: (receiptId: number, loanAddress: string) => Promise<void>;
}

export const ReceiptPledgeModal: React.FC<ReceiptPledgeModalProps> = ({
  isOpen,
  receipt,
  onClose,
  onPledge,
}) => {
  const [loanAddress, setLoanAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !receipt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanAddress || !loanAddress.startsWith('C') || loanAddress.length !== 56) {
      setError('Please provide a valid 56-character Soroban agricultural loan contract address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onPledge(receipt.id, loanAddress);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to pledge receipt collateral.');
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
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Pledge Receipt Collateral</h3>
            <p className="text-xs text-slate-400">Lock Receipt #{receipt.id} to secure loan liquidity</p>
          </div>
        </div>

        <div className="p-3.5 mb-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Commodity:</span>
            <span className="font-semibold text-white">{receipt.commodityType}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Quantity:</span>
            <span className="font-semibold text-white">{receipt.quantityKg.toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Quality Grade:</span>
            <span className="font-semibold text-white">Grade {receipt.qualityGrade}</span>
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
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Loan Contract Address (Soroban)
            </label>
            <input
              type="text"
              value={loanAddress}
              onChange={(e) => setLoanAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="C... agricultural loan contract"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-amber-900/30 transition-all duration-200"
          >
            {loading ? (
              <span>Pledging on Soroban...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Lien Pledge</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
