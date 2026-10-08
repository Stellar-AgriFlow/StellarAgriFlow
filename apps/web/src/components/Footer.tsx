'use client';

import React from 'react';
import { Sprout, ExternalLink, Shield } from 'lucide-react';
import { STELLAR_TESTNET_CONFIG } from '@agriflow/stellar';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AgriFlow Protocol</p>
              <p className="text-xs text-slate-400">
                Global Agricultural Financial and Trade Infrastructure
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <a
              href="https://developers.stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Stellar Docs
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://www.freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Freighter Wallet
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={STELLAR_TESTNET_CONFIG.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Stellar.Expert Testnet
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Stellar Testnet Deployment</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} AgriFlow. Non-custodial agricultural payment protocol. Built on the Stellar Network.
        </div>
      </div>
    </footer>
  );
};
