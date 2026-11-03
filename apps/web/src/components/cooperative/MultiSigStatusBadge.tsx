'use client';

import React from 'react';
import { KeyRound, CheckCircle2, ShieldCheck, PenTool } from 'lucide-react';

interface MultiSigStatusBadgeProps {
  collectedWeight: number;
  requiredWeight: number;
  isSigner?: boolean;
  hasUserSigned?: boolean;
  onSign?: () => Promise<void>;
  isSigning?: boolean;
}

export const MultiSigStatusBadge: React.FC<MultiSigStatusBadgeProps> = ({
  collectedWeight,
  requiredWeight,
  isSigner = false,
  hasUserSigned = false,
  onSign,
  isSigning = false,
}) => {
  const isSatisfied = collectedWeight >= requiredWeight;
  const percent = Math.min(100, Math.round((collectedWeight / (requiredWeight || 1)) * 100));

  return (
    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <KeyRound className="w-3.5 h-3.5 text-teal-400" />
          <span>Stellar Multi-Sig Threshold</span>
        </div>
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 ${
            isSatisfied
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}
        >
          {isSatisfied ? (
            <>
              <CheckCircle2 className="w-3 h-3" /> Ready
            </>
          ) : (
            <>
              <ShieldCheck className="w-3 h-3" /> {requiredWeight - collectedWeight} needed
            </>
          )}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Signatures</span>
          <span className="font-mono text-slate-200">
            {collectedWeight} / {requiredWeight} weight ({percent}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isSatisfied ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {isSigner && !hasUserSigned && onSign && !isSatisfied && (
        <button
          onClick={onSign}
          disabled={isSigning}
          className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <PenTool className="w-3.5 h-3.5" />
          {isSigning ? 'Signing...' : 'Sign Multi-Sig Envelope'}
        </button>
      )}
    </div>
  );
};
