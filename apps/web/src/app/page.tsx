'use client';

import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HeroLanding } from '../components/HeroLanding';
import { BalanceCard } from '../components/BalanceCard';
import { PaymentForm } from '../components/PaymentForm';
import { Card, Badge } from '@agriflow/ui';
import {
  Wheat,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { STELLAR_TESTNET_CONFIG } from '@agriflow/stellar';

export default function HomePage() {
  const { state: walletState } = useWallet();
  const isConnected = walletState.status === 'connected' && Boolean(walletState.account);

  return (
    <div className="min-h-screen flex flex-col agri-bg-glow">
      <Header />

      <main className="flex-1">
        {!isConnected ? (
          <HeroLanding />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {/* Top Dashboard Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Agricultural Payment Terminal
                  </h1>
                  <Badge variant="emerald" size="sm">
                    Live Testnet
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Manage real-time settlement for farm inputs, crop purchases, and logistics.
                </p>
              </div>

              {/* Quick Network Status Card */}
              <div className="flex items-center gap-2 text-xs bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-slate-400">Target Network:</span>
                <span className="text-emerald-400 font-medium">Stellar Testnet Horizon</span>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Balance & Overview (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <BalanceCard />

                {/* AgriFlow Settlement Protocols Info Card */}
                <Card className="p-6 bg-slate-900/60 border-slate-800 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Protocol Settlement Standards
                  </h3>
                  <div className="space-y-3 text-xs text-slate-400">
                    <div className="flex items-start gap-2.5">
                      <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-slate-300">Deterministic Finality:</strong> All transactions settle directly on the Stellar distributed ledger in 3 to 5 seconds.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <FileCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-slate-300">Auditable Memo Tags:</strong> Payment purposes are recorded directly with the transaction for trade verification and bookkeeping.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <TrendingUp className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-slate-300">Zero Intermediary Fees:</strong> Direct peer-to-peer transfers eliminate correspondent banking delays and foreign exchange markups.
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <a
                      href={STELLAR_TESTNET_CONFIG.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      <span>Explore Stellar Testnet Network Statistics</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </Card>
              </div>

              {/* Right Column: Payment Form (7 cols) */}
              <div className="lg:col-span-7">
                <PaymentForm />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
