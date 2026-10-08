'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HeroLanding } from '../components/HeroLanding';
import { BalanceCard } from '../components/BalanceCard';
import { PaymentForm } from '../components/PaymentForm';
import { FarmPassportForm } from '../components/FarmPassportForm';
import { FarmPassportList } from '../components/FarmPassportList';
import { ActivityFeed } from '../components/ActivityFeed';
import { WalletModal } from '../components/WalletModal';
import { defaultFarmRegistryClient } from '@agriflow/contracts-client';
import { FarmPassport } from '@agriflow/types';
import { Card, Badge, Button } from '@agriflow/ui';
import {
  FileBadge2,
  Send,
  Activity,
  ShieldCheck,
  Zap,
  Globe2,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { STELLAR_TESTNET_CONFIG, FARM_REGISTRY_CONTRACT_ID, getContractExplorerUrl } from '@agriflow/stellar';

export default function HomePage() {
  const { state: walletState } = useWallet();
  const isConnected = walletState.status === 'connected' && Boolean(walletState.account);

  const [activeTab, setActiveTab] = useState<'passports' | 'payments' | 'activity'>('passports');
  const [passports, setPassports] = useState<FarmPassport[]>([]);
  const [isLoadingPassports, setIsLoadingPassports] = useState(false);

  const loadPassports = async () => {
    setIsLoadingPassports(true);
    try {
      const list = await defaultFarmRegistryClient.getAllFarms();
      setPassports(list);
    } catch {
      // Keep existing
    } finally {
      setIsLoadingPassports(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadPassports();
    }
  }, [isConnected]);

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
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Agricultural Financial Terminal
                  </h1>
                  <Badge variant="emerald" size="sm">
                    Soroban & Horizon
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Manage on-chain Farm Passports, global agricultural payments, and contract events.
                </p>
              </div>

              {/* Deployed Contract Address Badge */}
              <div className="flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-slate-400">FarmRegistry:</span>
                <a
                  href={getContractExplorerUrl(FARM_REGISTRY_CONTRACT_ID)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 font-mono font-medium hover:text-emerald-300 flex items-center gap-1"
                  title="View Contract on Stellar.Expert"
                >
                  {FARM_REGISTRY_CONTRACT_ID.slice(0, 6)}...{FARM_REGISTRY_CONTRACT_ID.slice(-4)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mb-8 border-b border-slate-800 pb-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('passports')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'passports'
                    ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-600/60 shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <FileBadge2 className="w-4 h-4" />
                <span>Farm Passports (Soroban)</span>
                <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                  {passports.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-600/60 shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Send Agricultural Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'activity'
                    ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-600/60 shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Recent Activity & Events</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'passports' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-6">
                  <FarmPassportForm
                    onFarmRegistered={(newPassport) => {
                      setPassports((prev) => [newPassport, ...prev]);
                    }}
                  />
                  <BalanceCard />
                </div>

                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        On-Chain Farm Passports
                      </h3>
                      <p className="text-xs text-slate-400">
                        Verifiable producer registries recorded in the FarmRegistry contract
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadPassports}
                      isLoading={isLoadingPassports}
                      className="text-xs"
                    >
                      Refresh Passports
                    </Button>
                  </div>

                  <FarmPassportList passports={passports} isLoading={isLoadingPassports} />
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-6">
                  <BalanceCard />

                  <Card className="p-6 bg-slate-900/60 border-slate-800 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Payment & Escrow Foundation
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Payments utilize Stellar Horizon native channels for sub-cent micro-settlement. Farm Passports will bridge directly into Soroban automated escrow and harvest forward financing.
                    </p>
                  </Card>
                </div>

                <div className="lg:col-span-7">
                  <PaymentForm />
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                  <ActivityFeed />
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <BalanceCard />

                  <Card className="p-6 bg-slate-900/60 border-slate-800 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Real-Time Event Indexing
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      The activity monitor polls live Soroban RPC events emitted by the <code className="text-emerald-400 font-mono text-[11px]">FarmRegistry</code> smart contract on Stellar Testnet, indexing <code className="text-amber-400 font-mono text-[11px]">FarmRegistered</code> occurrences.
                    </p>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      <WalletModal />
    </div>
  );
}
