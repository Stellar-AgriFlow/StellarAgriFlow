'use client';

import React from 'react';
import { FarmPassport } from '@agriflow/types';
import { Card, Badge } from '@agriflow/ui';
import {
  FileBadge2,
  MapPin,
  Wheat,
  Scale,
  Calendar,
  ExternalLink,
  ShieldCheck,
  User,
} from 'lucide-react';
import { shortenAddress, getTxExplorerUrl } from '@agriflow/stellar';

export interface FarmPassportListProps {
  passports: FarmPassport[];
  isLoading?: boolean;
}

export const FarmPassportList: React.FC<FarmPassportListProps> = ({ passports, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (passports.length === 0) {
    return (
      <Card className="p-8 text-center bg-slate-900/60 border-slate-800 space-y-3">
        <FileBadge2 className="w-10 h-10 text-slate-600 mx-auto" />
        <h4 className="text-base font-semibold text-slate-300">No Farm Passports Registered Yet</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Complete the Farm Passport form to register the first agricultural producer identity on the Soroban smart contract.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {passports.map((passport) => {
        const dateStr = new Date(passport.registrationTimestamp * 1000).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        return (
          <Card
            key={passport.farmId}
            className="p-5 md:p-6 bg-slate-900/80 border-slate-800 hover:border-emerald-600/50 transition-all duration-200 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <FileBadge2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-white">
                      {passport.farmId}
                    </span>
                    <Badge variant="emerald" size="sm">
                      {passport.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Owner: </span>
                    <span className="font-mono text-slate-300">
                      {shortenAddress(passport.owner, 5)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {dateStr}
                </span>
                {passport.txHash && (
                  <a
                    href={getTxExplorerUrl(passport.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded bg-emerald-950/40 border border-emerald-800/50"
                  >
                    <span>Tx Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Farm agricultural specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Country & Region</span>
                <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{passport.country}, {passport.region}</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Primary Crop</span>
                <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                  <Wheat className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{passport.crop}</span>
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Acreage / Size</span>
                <span className="text-slate-200 font-mono font-medium block mt-0.5">
                  {passport.farmSizeHectares} Hectares
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Expected Yield</span>
                <span className="text-slate-200 font-mono font-medium block mt-0.5">
                  {passport.expectedYieldTons} Metric Tons
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Immutable on-chain Soroban contract state (Stellar Testnet)</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
