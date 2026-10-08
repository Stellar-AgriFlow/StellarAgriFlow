'use client';

import React from 'react';
import { STELLAR_TESTNET_CONFIG } from '@agriflow/stellar';

export const NetworkStatusBadge: React.FC<{ showDetails?: boolean }> = ({ showDetails = false }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-700/40 text-emerald-300 text-xs font-medium backdrop-blur-sm shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>Stellar Testnet</span>
      {showDetails && (
        <span className="hidden sm:inline-block text-emerald-500/80 pl-1 border-l border-emerald-800/80">
          Horizon Active
        </span>
      )}
    </div>
  );
};
