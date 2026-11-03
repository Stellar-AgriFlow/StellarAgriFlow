'use client';

import React, { useState } from 'react';
import { Gavel, AlertOctagon, TrendingDown, Shield } from 'lucide-react';
import { CollateralAuction } from '@agriflow/types';
import { DutchAuctionCard } from '../../components/liquidation/DutchAuctionCard';

const MOCK_AUCTIONS: CollateralAuction[] = [
  {
    id: 1,
    borrower: 'GDFARMER...BREACHED01',
    receiptId: 12,
    debtAmount: 8500,
    startPrice: 12000,
    reservePrice: 7000,
    startTime: Math.floor(Date.now() / 1000) - 300,
    durationSeconds: 1800, // 30 mins
    status: 'Active',
    finalPrice: 0,
  },
  {
    id: 2,
    borrower: 'GDFARMER...BREACHED02',
    receiptId: 19,
    debtAmount: 4200,
    startPrice: 6500,
    reservePrice: 3800,
    startTime: Math.floor(Date.now() / 1000) - 600,
    durationSeconds: 1200,
    status: 'Active',
    finalPrice: 0,
  },
  {
    id: 3,
    borrower: 'GDFARMER...BREACHED03',
    receiptId: 8,
    debtAmount: 15000,
    startPrice: 20000,
    reservePrice: 13000,
    startTime: Math.floor(Date.now() / 1000) - 3600,
    durationSeconds: 1800,
    status: 'Filled',
    buyer: 'GDBUYER...GRAINCORP',
    finalPrice: 16500,
  },
];

export default function CollateralAuctionsPage() {
  const [auctions, setAuctions] = useState<CollateralAuction[]>(MOCK_AUCTIONS);
  const [biddingId, setBiddingId] = useState<number | null>(null);

  const handleBid = async (auctionId: number, currentPrice: number) => {
    setBiddingId(auctionId);
    setTimeout(() => {
      setAuctions(
        auctions.map((a) =>
          a.id === auctionId
            ? {
                ...a,
                status: 'Filled',
                buyer: 'GDCURRENT...USER',
                finalPrice: currentPrice,
              }
            : a
        )
      );
      setBiddingId(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Gavel className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Collateral Liquidation Dutch Auctions
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Decentralized on-chain auctions for distressed agricultural commodity collateral with continuous downward price discovery
          </p>
        </div>

        {/* Notice Banner */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3.5 text-xs text-slate-300">
          <AlertOctagon className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block mb-0.5">
              How Dutch Collateral Auctions Work:
            </span>
            <span>
              Prices start above market value and decrease automatically each second until a buyer bids. The first bidder secures the entire e-NWR warehouse receipt. Any sales proceeds exceeding outstanding loan principal are automatically refunded to the farmer borrower.
            </span>
          </div>
        </div>

        {/* Auction Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <DutchAuctionCard
              key={auction.id}
              auction={auction}
              onBid={handleBid}
              isBidding={biddingId === auction.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
