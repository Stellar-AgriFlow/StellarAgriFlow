'use client';

import React from 'react';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { StellarExpertHelper } from '../../services/stellarExpert';

export interface TickerItem {
  symbol: string;
  priceUsd: number;
  change24hPercent: number;
  twapUsd: number;
  contractId: string;
}

const DEFAULT_TICKERS: TickerItem[] = [
  {
    symbol: 'WHEAT',
    priceUsd: 0.65,
    change24hPercent: 2.4,
    twapUsd: 0.64,
    contractId: 'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ',
  },
  {
    symbol: 'MAIZE',
    priceUsd: 0.42,
    change24hPercent: -1.2,
    twapUsd: 0.43,
    contractId: 'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ',
  },
  {
    symbol: 'SOYBEAN',
    priceUsd: 1.15,
    change24hPercent: 0.8,
    twapUsd: 1.14,
    contractId: 'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ',
  },
  {
    symbol: 'COFFEE',
    priceUsd: 4.85,
    change24hPercent: 3.1,
    twapUsd: 4.75,
    contractId: 'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ',
  },
  {
    symbol: 'COCOA',
    priceUsd: 7.2,
    change24hPercent: 5.4,
    twapUsd: 7.05,
    contractId: 'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ',
  },
];

export const CommodityTickerTape: React.FC<{ tickers?: TickerItem[] }> = ({
  tickers = DEFAULT_TICKERS,
}) => {
  const explorer = new StellarExpertHelper('testnet');

  return (
    <div className="w-full overflow-x-auto py-2.5 px-4 bg-slate-950/80 border-y border-slate-800/80 backdrop-blur-md">
      <div className="flex items-center gap-6 min-w-max">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Soroban Oracle Feeds
        </span>

        {tickers.map((t) => {
          const isUp = t.change24hPercent >= 0;
          return (
            <div key={t.symbol} className="flex items-center gap-2.5 text-xs">
              <span className="font-bold text-white tracking-wide">{t.symbol}/USD</span>
              <span className="font-semibold text-slate-200">${t.priceUsd.toFixed(2)}</span>
              <div
                className={`flex items-center text-[11px] font-medium ${
                  isUp ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                <span>{isUp ? `+${t.change24hPercent}%` : `${t.change24hPercent}%`}</span>
              </div>
              <span className="text-[10px] text-slate-400">TWAP: ${t.twapUsd.toFixed(2)}</span>
              <a
                href={explorer.getContractUrl(t.contractId)}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title="Verify on StellarExpert"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
