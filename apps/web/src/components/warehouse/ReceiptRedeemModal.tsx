'use client';

import React, { useState } from 'react';
import { X, Flame, CheckCircle, AlertTriangle } from 'lucide-react';
import { WarehouseReceipt } from '@agriflow/types';

interface ReceiptRedeemModalProps {
  isOpen: boolean;
  receipt: WarehouseReceipt | null;
  onClose: () => void;
  onRedeem: (receiptId: number) => Promise<void>;
}

export const ReceiptRedeemModal: React.FC<ReceiptRedeemModalProps> = ({
  isOpen,
  receipt,
  onClose,
  onRedeem,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !receipt) return null;

  const handleRedeem = async () => {
    if (!confirmed) {
      setError('Please acknowledge physical pickup terms.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onRedeem(receipt.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to redeem and burn receipt.');
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
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Redeem Physical Produce</h3>
            <p className="text-xs text-slate-400">Burn Receipt #{receipt.id} to release custody</p>
          </div>
        </div>

        <div className="p-3.5 mb-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Commodity:</span>
            <span className="font-semibold text-white">{receipt.commodityType}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Redemption Quantity:</span>
            <span className="font-semibold text-white">{receipt.quantityKg.toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Warehouse Custodian:</span>
            <span className="font-mono text-slate-400 truncate max-w-[200px]">{receipt.warehouseAddress}</span>
          </div>
        </div>

        <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Redemption permanently burns the on-chain receipt token. Physical produce will be dispatched to your authorized carrier upon settlement.
          </span>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        )}

        <label className="flex items-center gap-2 mb-4 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-orange-600 focus:ring-0"
          />
          <span>I confirm inspection and physical transfer readiness</span>
        </label>

        <button
          onClick={handleRedeem}
          disabled={loading || !confirmed}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-orange-900/30 transition-all duration-200"
        >
          {loading ? (
            <span>Burning token on Soroban...</span>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Burn & Release Produce</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
