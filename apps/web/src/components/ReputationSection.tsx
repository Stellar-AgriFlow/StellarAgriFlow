'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { defaultReputationClient } from '@agriflow/contracts-client';
import { ReputationRecord } from '@agriflow/types';
import { Card, Badge } from '@agriflow/ui';
import {
  Award,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Lock,
  Star,
  Sparkles,
  FileBadge2,
} from 'lucide-react';
import { shortenAddress, AGRICULTURAL_REPUTATION_CONTRACT_ID, getContractExplorerUrl } from '@agriflow/stellar';

export function ReputationSection() {
  const { state: walletState } = useWallet();
  const address = walletState.account?.address;

  const [reputation, setReputation] = useState<ReputationRecord>({
    user: address || 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
    successfulTrades: 8,
    completedFinancing: 3,
    successfulRepayments: 3,
    completedEscrows: 6,
    reputationScore: 185,
    trustTier: 'Gold',
    updatedAt: Date.now(),
  });

  useEffect(() => {
    if (address) {
      defaultReputationClient.getReputation(address).then((rep) => {
        setReputation(rep);
      });
    }
  }, [address]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            Agricultural Reputation & Trust Protocol
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-proof trust score minted exclusively through verified Soroban smart-contract settlements.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
          <span className="text-slate-400">Reputation Contract:</span>
          <a
            href={getContractExplorerUrl(AGRICULTURAL_REPUTATION_CONTRACT_ID)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 font-mono hover:underline"
          >
            {AGRICULTURAL_REPUTATION_CONTRACT_ID.slice(0, 6)}...{AGRICULTURAL_REPUTATION_CONTRACT_ID.slice(-4)}
          </a>
        </div>
      </div>

      {/* Main Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-4 p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                AgriFlow Trust Tier
              </span>
              <Badge variant="emerald" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                {reputation.trustTier} Tier
              </Badge>
            </div>

            <div className="text-center py-4">
              <div className="text-5xl font-black tracking-tight text-white mb-2">
                {reputation.reputationScore}
              </div>
              <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Verified On-Chain Rating
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="font-mono text-slate-300">
                {address ? shortenAddress(address, 5) : 'Not Connected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Next Tier:</span>
              <span className="text-emerald-300 font-medium">Platinum (250 pts)</span>
            </div>
          </div>
        </Card>

        <div className="md:col-span-8 grid grid-cols-2 gap-4">
          <Card className="p-5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">
                  {reputation.successfulTrades}
                </span>
                <span className="text-xs text-slate-400">Successful Trades</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              +10 points awarded per verified produce delivery.
            </p>
          </Card>

          <Card className="p-5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">
                  {reputation.completedFinancing}
                </span>
                <span className="text-xs text-slate-400">Harvest Loans Funded</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              +15 points awarded per completed capital disbursement.
            </p>
          </Card>

          <Card className="p-5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">
                  {reputation.successfulRepayments}
                </span>
                <span className="text-xs text-slate-400">Full Loan Repayments</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              +25 points awarded per on-time harvest loan repayment.
            </p>
          </Card>

          <Card className="p-5 bg-slate-900/80 border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">
                  {reputation.completedEscrows}
                </span>
                <span className="text-xs text-slate-400">Escrow Settlements</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              +10 points awarded per dispute-free escrow release.
            </p>
          </Card>
        </div>
      </div>

      <Card className="p-6 bg-slate-900/50 border-slate-800/80 space-y-2 text-xs text-slate-400 leading-relaxed">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Cryptographic Anti-Sybil Architecture
        </h4>
        <p>
          Arbitrary participants cannot self-mint reputation points. Invocations of the AgriculturalReputation contract are restricted to authorized Soroban protocol contracts (AgriculturalEscrow and AgriculturalFinance) using cryptographic authorization (`caller.require_auth()`).
        </p>
      </Card>
    </div>
  );
}
