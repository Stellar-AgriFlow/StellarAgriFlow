'use client';

import React, { useState } from 'react';
import { Leaf, Award, Flame, CheckCircle, ShieldCheck } from 'lucide-react';

export interface CarbonOffsetBadgeProps {
  farmName: string;
  hectares: number;
  practice: string;
  verifiedTonsCo2: number;
  tokenBalance: number;
  onRetireCredits?: (tons: number) => Promise<void>;
}

export const CarbonOffsetBadge: React.FC<CarbonOffsetBadgeProps> = ({
  farmName,
  hectares,
  practice,
  verifiedTonsCo2,
  tokenBalance,
  onRetireCredits,
}) => {
  const [retiring, setRetiring] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const handleRetire = async () => {
    if (!onRetireCredits || tokenBalance <= 0) return;
    try {
      setRetiring(true);
      await onRetireCredits(Math.min(10, tokenBalance));
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 3000);
    } catch (err) {
      console.error('Failed to retire credits', err);
    } finally {
      setRetiring(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">{farmName}</h4>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Regenerative Soil
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/50">
            {practice}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 my-3 text-sm">
          <div className="bg-slate-800/60 rounded-lg p-2.5">
            <span className="text-xs text-slate-400 block">Sequestered CO₂e</span>
            <span className="text-lg font-mono font-bold text-white">
              {verifiedTonsCo2.toLocaleString()} t
            </span>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-2.5">
            <span className="text-xs text-slate-400 block">Retirable Tokens</span>
            <span className="text-lg font-mono font-bold text-emerald-300">
              {tokenBalance.toLocaleString()} CROP-C
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Land Coverage: <span className="text-slate-200">{hectares} Hectares</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        {successNotice ? (
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            10 t CO₂e Burned on Soroban!
          </span>
        ) : (
          <span className="text-xs text-slate-400">Burn to generate proof certificate</span>
        )}

        <button
          onClick={handleRetire}
          disabled={retiring || tokenBalance <= 0}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
        >
          <Flame className="w-3.5 h-3.5 text-amber-300" />
          {retiring ? 'Burning...' : 'Retire 10t CO₂'}
        </button>
      </div>
    </div>
  );
};
