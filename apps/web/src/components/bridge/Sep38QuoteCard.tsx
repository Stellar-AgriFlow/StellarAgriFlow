'use client';

import React from 'react';
import { ArrowRightLeft, ShieldCheck, Clock } from 'lucide-react';
import { Sep38QuoteResponse } from '@agriflow/stellar';

interface Sep38QuoteCardProps {
  quote: Sep38QuoteResponse;
  onAccept?: (quoteId: string) => void;
  isAccepting?: boolean;
}

export const Sep38QuoteCard: React.FC<Sep38QuoteCardProps> = ({
  quote,
  onAccept,
  isAccepting = false,
}) => {
  const expires = new Date(quote.expires_at).toLocaleTimeString();

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-slate-100">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Guaranteed SEP-38 Firm Quote</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          <Clock className="w-3 h-3" />
          <span>Valid until {expires}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-sm">
        <div>
          <span className="text-xs text-slate-400 block">You Sell</span>
          <span className="font-bold text-white">
            {quote.sell_amount} {quote.sell_asset.split(':')[1] || quote.sell_asset}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">You Receive</span>
          <span className="font-bold text-emerald-400">
            {quote.buy_amount} {quote.buy_asset.split(':')[1] || quote.buy_asset}
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-400 space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Exchange Rate:</span>
          <span className="text-slate-200 font-mono">1 {quote.sell_asset.split(':')[1] || 'UNIT'} = {quote.price}</span>
        </div>
        <div className="flex justify-between">
          <span>Network & Anchor Fee:</span>
          <span className="text-slate-200">{quote.fee.total} {quote.fee.asset}</span>
        </div>
      </div>

      {onAccept && (
        <button
          onClick={() => onAccept(quote.id)}
          disabled={isAccepting}
          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isAccepting ? 'Locking Rate...' : 'Lock Guaranteed Price & Execute'}</span>
        </button>
      )}
    </div>
  );
};
