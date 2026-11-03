'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Warehouse, Sparkles } from 'lucide-react';

interface ReceiptMintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMint: (params: {
    commodityType: string;
    quantityKg: number;
    moisturePercent: number;
    qualityGrade: number;
    warehouseAddress: string;
  }) => Promise<void>;
}

export const ReceiptMintModal: React.FC<ReceiptMintModalProps> = ({
  isOpen,
  onClose,
  onMint,
}) => {
  const [commodityType, setCommodityType] = useState('Wheat');
  const [quantityKg, setQuantityKg] = useState('5000');
  const [moisturePercent, setMoisturePercent] = useState('12.5');
  const [qualityGrade, setQualityGrade] = useState('1');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = Number(quantityKg);
    const moisture = Math.round(Number(moisturePercent) * 100);
    const grade = Number(qualityGrade);

    if (isNaN(qty) || qty <= 0) {
      setError('Please provide a valid produce quantity in kg.');
      return;
    }

    if (moisture > 1400) {
      setError('Moisture content exceeds 14.0% limit for grain storage standard.');
      return;
    }

    setLoading(true);
    try {
      await onMint({
        commodityType,
        quantityKg: qty,
        moisturePercent: moisture,
        qualityGrade: grade,
        warehouseAddress,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to mint warehouse receipt on Stellar.');
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
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Mint Electronic Warehouse Receipt</h3>
            <p className="text-xs text-slate-400">Tokenize physical harvest into a negotiable RWA on Stellar</p>
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
              Commodity
            </label>
            <select
              value={commodityType}
              onChange={(e) => setCommodityType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="Wheat">Wheat (Grain)</option>
              <option value="Maize">White Maize / Corn</option>
              <option value="Soybean">Soybeans</option>
              <option value="Coffee">Arabica Coffee</option>
              <option value="Cocoa">Cocoa Beans</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Net Quantity (kg)
              </label>
              <input
                type="number"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Moisture (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={moisturePercent}
                onChange={(e) => setMoisturePercent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="12.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Quality Grade
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="1">Grade 1 (Premium Export)</option>
                <option value="2">Grade 2 (Standard Commercial)</option>
                <option value="3">Grade 3 (Feed Grade)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Custodian Warehouse ID
              </label>
              <input
                type="text"
                value={warehouseAddress}
                onChange={(e) => setWarehouseAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="G... custodian public key"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-200"
            >
              {loading ? (
                <span>Minting on Soroban...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Issue e-NWR Token</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
