'use client';

import React from 'react';
import { Award, Zap } from 'lucide-react';
import { CreditScoreResult } from '../../services/creditScoringEngine';

export const CreditScoreBadge: React.FC<{ result: CreditScoreResult }> = ({ result }) => {
  const getBadgeStyle = () => {
    switch (result.tier) {
      case 'Diamond':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
      case 'Platinum':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-300';
      case 'Gold':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'Silver':
        return 'bg-slate-500/10 border-slate-500/30 text-slate-300';
      case 'Bronze':
      default:
        return 'bg-orange-950/40 border-orange-800/40 text-orange-400';
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl border ${getBadgeStyle()}`}>
      <div className="flex items-center gap-1.5">
        <Award className="w-4 h-4" />
        <span className="font-bold text-xs uppercase tracking-wide">{result.tier} Tier</span>
      </div>

      <div className="h-3 w-[1px] bg-white/20" />

      <div className="text-xs">
        <span className="text-white/70">Score:</span>{' '}
        <span className="font-bold text-white">{result.score}</span>
      </div>

      {result.recommendedInterestDiscountBps > 0 && (
        <>
          <div className="h-3 w-[1px] bg-white/20" />
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
            <Zap className="w-3 h-3" />
            <span>-{result.recommendedInterestDiscountBps / 100}% APR</span>
          </div>
        </>
      )}
    </div>
  );
};
