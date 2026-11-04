'use client';

import React from 'react';
import { ShieldCheck, Warehouse, Coins, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export interface ProofOfReserveBannerProps {
  commoditySymbol: string;
  circulatingTokens: number;
  physicalSiloTonnes: number;
  collateralizationRatioPercent: number;
  lastAuditedTimestamp: number;
  silosCount: number;
}

export const ProofOfReserveBanner: React.FC<ProofOfReserveBannerProps> = ({
  commoditySymbol,
  circulatingTokens,
  physicalSiloTonnes,
  collateralizationRatioPercent,
  lastAuditedTimestamp,
  silosCount,
}) => {
  const isOverCollateralized = collateralizationRatioPercent >= 100.0;
  const surplusTonnes = physicalSiloTonnes - circulatingTokens;
  const auditDateStr = new Date(lastAuditedTimestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-white tracking-wide">
              Proof of Reserve (PoR): 100% Silo Backed
            </h3>
            <span
              className={`px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full border ${
                isOverCollateralized
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                  : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
              }`}
            >
              {collateralizationRatioPercent.toFixed(1)}% BACKED
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Tokenized {commoditySymbol} warehouse receipts on Stellar are cryptographically verified
            against physical scale audits across {silosCount} licensed grain elevators.
          </p>
        </div>

        {/* Right: Metrics stats */}
        <div className="flex items-center gap-6">
          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400 flex items-center md:justify-end gap-1">
              <Warehouse className="w-3.5 h-3.5 text-emerald-400" />
              Audited Silo Reserves
            </span>
            <span className="text-lg font-mono font-bold text-white">
              {physicalSiloTonnes.toLocaleString()} MT
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400 flex items-center md:justify-end gap-1">
              <Coins className="w-3.5 h-3.5 text-blue-400" />
              Circulating Tokens
            </span>
            <span className="text-lg font-mono font-bold text-slate-200">
              {circulatingTokens.toLocaleString()} {commoditySymbol}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400 block">Surplus Buffer</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              +{surplusTonnes.toLocaleString()} MT
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Last Silo Audit: <strong className="text-slate-300">{auditDateStr}</strong></span>
        <span className="text-emerald-400/90 font-mono flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          On-Chain Attestation Verified
        </span>
      </div>
    </div>
  );
};
