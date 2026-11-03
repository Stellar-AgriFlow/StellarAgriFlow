'use client';

import React from 'react';
import { Activity, Radio, ExternalLink } from 'lucide-react';
import { ParsedSorobanEvent } from '@agriflow/contracts-client';
import { StellarExpertHelper } from '../../services/stellarExpert';

interface LiveEventFeedProps {
  events: ParsedSorobanEvent[];
  maxDisplay?: number;
}

export const LiveEventFeed: React.FC<LiveEventFeedProps> = ({ events, maxDisplay = 10 }) => {
  const explorer = new StellarExpertHelper('testnet');
  const displayedEvents = events.slice(0, maxDisplay);

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-slate-100">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">Live On-Chain Event Stream</h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Real-time</span>
        </div>
      </div>

      {displayedEvents.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Listening for Soroban contract events on Stellar testnet...
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 rounded-xl transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-300">{evt.topic}</span>
                  {evt.subTopic && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                      {evt.subTopic}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Ledger #{evt.ledger} · {new Date(evt.ledgerClosedAt).toLocaleTimeString()}
                </span>
              </div>

              <a
                href={explorer.getContractUrl(evt.contractId)}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title="View contract on StellarExpert"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
