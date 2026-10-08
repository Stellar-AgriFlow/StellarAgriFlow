'use client';

import React from 'react';
import { useWallet } from '../context/WalletContext';
import { Button, Card, Badge } from '@agriflow/ui';
import {
  Wallet,
  ArrowRight,
  Shield,
  Zap,
  Globe2,
  Wheat,
  Download,
  AlertCircle,
  Truck,
  Layers,
} from 'lucide-react';

export const HeroLanding: React.FC = () => {
  const { state, connect, openWalletModal } = useWallet();

  return (
    <div className="py-12 lg:py-20 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Wallet error banner if present */}
      {state.error && (
        <div className="mb-8 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3 backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-red-300">Connection notice: </span>
            {state.error}
            {state.status === 'not-installed' && (
              <div className="mt-2">
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install Freighter Wallet Extension
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-600/40 text-emerald-300 text-xs font-medium shadow-inner">
          <Wheat className="w-3.5 h-3.5 text-emerald-400" />
          <span>Agricultural Financial Protocol</span>
          <span className="text-emerald-600">•</span>
          <span className="text-amber-400 font-semibold">Stellar Testnet</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          AgriFlow
        </h1>

        <p className="text-xl sm:text-2xl font-medium bg-gradient-to-r from-emerald-300 via-emerald-100 to-amber-200 bg-clip-text text-transparent">
          Global agricultural payments powered by Stellar.
        </p>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
          AgriFlow is building financial infrastructure for global agriculture, connecting farmers, buyers and agricultural businesses through fast, transparent Stellar payments.
        </p>

        {/* Primary CTA buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            variant="primary"
            onClick={openWalletModal}
            isLoading={state.status === 'connecting'}
            className="w-full sm:w-auto text-base px-7 py-3.5 shadow-xl shadow-emerald-950/60"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => connect('TESTNET_DEMO')}
            className="w-full sm:w-auto text-base px-6 py-3.5 border-emerald-800/80 hover:bg-emerald-950/40 text-emerald-300"
          >
            <span>Explore Testnet Terminal</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <a
            href="https://developers.stellar.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium text-slate-300 hover:text-white px-5 py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-colors gap-2"
          >
            <span>Learn Stellar Architecture</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Feature / Value Pillars */}
      <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-900/70 border-slate-800 hover:border-emerald-600/40 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Instant Settlement</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Direct farmer and supplier disbursements in ~4 seconds on Stellar Testnet with sub-cent transaction fees.
          </p>
        </Card>

        <Card className="p-6 bg-slate-900/70 border-slate-800 hover:border-amber-600/40 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
            <Wheat className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Agricultural Purpose Tagging</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Categorized on-chain payment metadata for farm inputs, crop purchases, logistics, and harvest financing.
          </p>
        </Card>

        <Card className="p-6 bg-slate-900/70 border-slate-800 hover:border-sky-600/40 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Non-Custodial Security</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Full key custody stays with your Freighter wallet. Zero private keys stored or exposed in application code.
          </p>
        </Card>
      </div>

      {/* Protocol Roadmap Preview */}
      <div className="mt-12 p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-semibold text-slate-200">AgriFlow Protocol Roadmap</h4>
              <p className="text-xs text-slate-400">
                Stellar Payments • Farm Passport • Soroban Escrow & Global Trade
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="emerald" size="sm">Stellar XLM Payments Active</Badge>
            <Badge variant="slate" size="sm">Smart Escrow Planned</Badge>
            <Badge variant="slate" size="sm">Agricultural Marketplace Planned</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
