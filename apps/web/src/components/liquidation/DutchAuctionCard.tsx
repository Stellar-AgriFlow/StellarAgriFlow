'use client';

import React, { useState, useEffect } from 'react';
import { Gavel, Clock, ArrowDown, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CollateralAuction } from '@agriflow/types';

interface DutchAuctionCardProps {
  auction: CollateralAuction;
  onBid: (auctionId: number, currentPrice: number) => Promise<void>;
  isBidding?: boolean;
}

export const DutchAuctionCard: React.FC<DutchAuctionCardProps> = ({
  auction,
  onBid,
  isBidding = false,
}) => {
  const [currentPrice, setCurrentPrice] = useState(auction.startPrice);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(auction.durationSeconds);

  useEffect(() => {
    if (auction.status !== 'Active') return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = Math.max(0, now - auction.startTime);
      const remaining = Math.max(0, auction.durationSeconds - elapsed);
      setTimeLeftSeconds(remaining);

      if (remaining === 0) {
        setCurrentPrice(auction.reservePrice);
      } else {
        const decay =
          ((auction.startPrice - auction.reservePrice) * elapsed) /
          auction.durationSeconds;
        setCurrentPrice(Math.round(Math.max(auction.reservePrice, auction.startPrice - decay)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  const isFilled = auction.status === 'Filled';
  const isExpired = auction.status === 'Expired';
  const isCancelled = auction.status === 'Cancelled';
  const isActive = auction.status === 'Active';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Collateral Auction #{auction.id}</h4>
              <p className="text-xs text-slate-400">e-NWR #{auction.receiptId} Grain Vault</p>
            </div>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : isFilled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {auction.status}
          </span>
        </div>

        {/* Live Price Block */}
        <div className="p-4 mb-4 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
          <span className="text-xs text-slate-400 block mb-1">
            {isActive ? 'Current Dutch Auction Price' : 'Settlement Price'}
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-extrabold text-white">
              ${(isActive ? currentPrice : auction.finalPrice).toLocaleString()}
            </span>
            {isActive && <ArrowDown className="w-4 h-4 text-emerald-400 animate-bounce" />}
          </div>
          {isActive && (
            <span className="text-[11px] text-slate-400 mt-1 block">
              Reserve Floor: ${auction.reservePrice.toLocaleString()} · Start: ${auction.startPrice.toLocaleString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-800/20 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Recovered Debt:</span>
            <span className="font-semibold text-slate-200">${auction.debtAmount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Time Remaining:</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{isActive ? formatTime(timeLeftSeconds) : 'Closed'}</span>
            </span>
          </div>
        </div>
      </div>

      <div>
        {isActive && (
          <button
            onClick={() => onBid(auction.id, currentPrice)}
            disabled={isBidding}
            className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-900/30 transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isBidding ? 'Confirming Transaction...' : `Buy at $${currentPrice.toLocaleString()}`}</span>
          </button>
        )}

        {isFilled && (
          <div className="w-full py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Auction Settled & Collateral Transferred</span>
          </div>
        )}
      </div>
    </div>
  );
};
