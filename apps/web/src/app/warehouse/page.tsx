'use client';

import React, { useState } from 'react';
import { Warehouse, Plus, Lock, Flame, Filter, ShieldCheck } from 'lucide-react';
import { WarehouseReceipt } from '@agriflow/types';
import { ReceiptMintModal } from '../../components/warehouse/ReceiptMintModal';
import { ReceiptPledgeModal } from '../../components/warehouse/ReceiptPledgeModal';
import { ReceiptRedeemModal } from '../../components/warehouse/ReceiptRedeemModal';

const MOCK_RECEIPTS: WarehouseReceipt[] = [
  {
    id: 1,
    owner: 'GDQW...FARMER1',
    commodityType: 'Wheat',
    quantityKg: 10000,
    qualityGrade: 1,
    moisturePercent: 1250, // 12.5%
    warehouseAddress: 'GCUSTODIAN...GRAINVAULT1',
    depositTimestamp: Math.floor(Date.now() / 1000) - 86400 * 5,
    status: 'Active',
  },
  {
    id: 2,
    owner: 'GDQW...FARMER1',
    commodityType: 'Maize',
    quantityKg: 25000,
    qualityGrade: 2,
    moisturePercent: 1320, // 13.2%
    warehouseAddress: 'GCUSTODIAN...GRAINVAULT1',
    depositTimestamp: Math.floor(Date.now() / 1000) - 86400 * 12,
    status: 'Pledged',
    encumberedTo: 'CLOANCONTRACT...AGRIFINANCE',
  },
  {
    id: 3,
    owner: 'GDQW...FARMER1',
    commodityType: 'Coffee',
    quantityKg: 3500,
    qualityGrade: 1,
    moisturePercent: 1100, // 11.0%
    warehouseAddress: 'GCUSTODIAN...HIGHLAND',
    depositTimestamp: Math.floor(Date.now() / 1000) - 86400 * 20,
    status: 'Active',
  },
];

export default function WarehouseReceiptsPage() {
  const [receipts, setReceipts] = useState<WarehouseReceipt[]>(MOCK_RECEIPTS);
  const [filterCommodity, setFilterCommodity] = useState('ALL');
  const [isMintOpen, setIsMintOpen] = useState(false);
  const [selectedPledgeReceipt, setSelectedPledgeReceipt] = useState<WarehouseReceipt | null>(null);
  const [selectedRedeemReceipt, setSelectedRedeemReceipt] = useState<WarehouseReceipt | null>(null);

  const filtered = receipts.filter(
    (r) => filterCommodity === 'ALL' || r.commodityType.toUpperCase() === filterCommodity
  );

  const handleMint = async (params: any) => {
    const newReceipt: WarehouseReceipt = {
      id: receipts.length + 1,
      owner: 'GDQW...CURRENTUSER',
      commodityType: params.commodityType,
      quantityKg: params.quantityKg,
      qualityGrade: params.qualityGrade,
      moisturePercent: params.moisturePercent,
      warehouseAddress: params.warehouseAddress || 'GCUSTODIAN...LOCALHUB',
      depositTimestamp: Math.floor(Date.now() / 1000),
      status: 'Active',
    };
    setReceipts([newReceipt, ...receipts]);
  };

  const handlePledge = async (receiptId: number, loanAddress: string) => {
    setReceipts(
      receipts.map((r) =>
        r.id === receiptId ? { ...r, status: 'Pledged', encumberedTo: loanAddress } : r
      )
    );
  };

  const handleRedeem = async (receiptId: number) => {
    setReceipts(
      receipts.map((r) => (r.id === receiptId ? { ...r, status: 'Redeemed' } : r))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Warehouse className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                RWA Electronic Warehouse Receipts (e-NWR)
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Tokenized grain and cash crop receipts minted under licensed warehouse custodians on Stellar
            </p>
          </div>

          <button
            onClick={() => setIsMintOpen(true)}
            className="flex items-center gap-2 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Mint New Crop Receipt</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['ALL', 'WHEAT', 'MAIZE', 'SOYBEAN', 'COFFEE'].map((sym) => (
            <button
              key={sym}
              onClick={() => setFilterCommodity(sym)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterCommodity === sym
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Receipts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((receipt) => {
            const isPledged = receipt.status === 'Pledged';
            const isRedeemed = receipt.status === 'Redeemed';
            const isActive = receipt.status === 'Active';

            return (
              <div
                key={receipt.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400">e-NWR #{receipt.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isPledged
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {receipt.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{receipt.commodityType}</h3>
                  <p className="text-2xl font-extrabold text-amber-400 mb-4">
                    {receipt.quantityKg.toLocaleString()} <span className="text-sm font-normal text-slate-400">kg</span>
                  </p>

                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/60 space-y-1.5 text-xs text-slate-300 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quality Grade:</span>
                      <span className="font-semibold text-white">Grade {receipt.qualityGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Moisture Level:</span>
                      <span className="font-semibold text-white">{(receipt.moisturePercent / 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deposited:</span>
                      <span>{new Date(receipt.depositTimestamp * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  {isActive && (
                    <>
                      <button
                        onClick={() => setSelectedPledgeReceipt(receipt)}
                        className="flex-1 py-2 px-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pledge</span>
                      </button>
                      <button
                        onClick={() => setSelectedRedeemReceipt(receipt)}
                        className="flex-1 py-2 px-3 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 text-xs font-semibold rounded-xl border border-orange-500/30 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Redeem</span>
                      </button>
                    </>
                  )}

                  {isPledged && (
                    <div className="w-full py-2 px-3 bg-slate-800/60 rounded-xl text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Collateralized in Microloan</span>
                    </div>
                  )}

                  {isRedeemed && (
                    <div className="w-full py-2 px-3 bg-slate-800/60 rounded-xl text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Redeemed & Burned</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modals */}
        <ReceiptMintModal
          isOpen={isMintOpen}
          onClose={() => setIsMintOpen(false)}
          onMint={handleMint}
        />
        <ReceiptPledgeModal
          isOpen={!!selectedPledgeReceipt}
          receipt={selectedPledgeReceipt}
          onClose={() => setSelectedPledgeReceipt(null)}
          onPledge={handlePledge}
        />
        <ReceiptRedeemModal
          isOpen={!!selectedRedeemReceipt}
          receipt={selectedRedeemReceipt}
          onClose={() => setSelectedRedeemReceipt(null)}
          onRedeem={handleRedeem}
        />
      </div>
    </div>
  );
}
