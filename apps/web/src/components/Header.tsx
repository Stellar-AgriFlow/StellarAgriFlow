'use client';

import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Button } from '@agriflow/ui';
import { NetworkStatusBadge } from './NetworkStatusBadge';
import { Sprout, Wallet, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';
import { getAccountExplorerUrl } from '@agriflow/stellar';

export const Header: React.FC = () => {
  const { state, connect, disconnect } = useWallet();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sprout className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">AgriFlow</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-400 border border-emerald-700/50">
                Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Global Agricultural Payments Powered by Stellar
            </p>
          </div>
        </div>

        {/* Right action area */}
        <div className="flex items-center gap-3">
          <NetworkStatusBadge />

          {state.status === 'connected' && state.account ? (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 pl-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <a
                  href={getAccountExplorerUrl(state.account.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono font-medium text-slate-200 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  title="View Account on Stellar Explorer"
                >
                  {state.account.shortAddress}
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 p-1.5 h-auto rounded-lg"
                title="Disconnect Wallet"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={connect}
              isLoading={state.status === 'connecting'}
              className="gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
