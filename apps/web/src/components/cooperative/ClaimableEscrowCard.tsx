'use client';

import React from 'react';
import { Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export interface ClaimableEscrowItem {
  id: string;
  title: string;
  amount: number;
  assetCode: string;
  sponsor: string;
  claimant: string;
  unlockTimestamp: number;
  status: 'LOCKED' | 'READY_TO_CLAIM' | 'CLAIMED';
}

interface ClaimableEscrowCardProps {
  item: ClaimableEscrowItem;
  onClaim: (id: string) => Promise<void>;
  isClaiming?: boolean;
}

export const ClaimableEscrowCard: React.FC<ClaimableEscrowCardProps> = ({
  item,
  onClaim,
  isClaiming = false,
}) => {
  const isReady = item.status === 'READY_TO_CLAIM';
  const isClaimed = item.status === 'CLAIMED';

  const unlockDate = new Date(item.unlockTimestamp * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg hover:border-slate-700 transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-mono text-emerald-400">ESCROW #{item.id}</span>
          <h4 className="text-sm font-bold text-white mt-0.5">{item.title}</h4>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Sponsor: {item.sponsor.slice(0, 6)}...{item.sponsor.slice(-4)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-mono font-bold text-emerald-400">
            {item.amount.toLocaleString()} {item.assetCode}
          </div>
          <span
            className={`inline-block px-2 py-0.5 mt-1 text-xs font-semibold rounded-full ${
              isClaimed
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : isReady
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {isClaimed ? 'Claimed' : isReady ? 'Unlocked' : 'Time-Locked'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Unlock: {unlockDate}</span>
        </div>

        <div>
          {isReady && !isClaimed && (
            <button
              onClick={() => onClaim(item.id)}
              disabled={isClaiming}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1 transition"
            >
              <span>{isClaiming ? 'Claiming...' : 'Claim Balance'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isClaimed && (
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settled On-Chain
            </span>
          )}

          {!isReady && !isClaimed && (
            <span className="flex items-center gap-1 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5" /> Protected by Stellar Predicate
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
