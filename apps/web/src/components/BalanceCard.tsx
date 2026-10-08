'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAccountBalance } from '../hooks/useAccountBalance';
import { Card, Button, Badge } from '@agriflow/ui';
import {
  Wallet,
  RefreshCw,
  Coins,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { fundWithFriendbot, getAccountExplorerUrl } from '@agriflow/stellar';

export const BalanceCard: React.FC = () => {
  const { state } = useWallet();
  const { balance, isLoading, error, refresh } = useAccountBalance(state.account?.address);
  const [isFunding, setIsFunding] = useState(false);
  const [fundingMessage, setFundingMessage] = useState<string | null>(null);

  const handleFundFriendbot = async () => {
    if (!state.account?.address) return;
    setIsFunding(true);
    setFundingMessage(null);
    try {
      const ok = await fundWithFriendbot(state.account.address);
      if (ok) {
        setFundingMessage('Account successfully funded with 10,000 Testnet XLM! Refreshing balance...');
        setTimeout(() => {
          refresh();
        }, 1500);
      } else {
        setFundingMessage('Friendbot request could not be completed. Please try again.');
      }
    } catch {
      setFundingMessage('Error contacting Stellar Friendbot.');
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-emerald-950/30 border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Wallet Balance
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">Connected Network:</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Stellar Testnet
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            isLoading={isLoading}
            className="text-xs py-1.5 px-3 h-auto border-slate-800 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {state.account && (
            <a
              href={getAccountExplorerUrl(state.account.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 px-2.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 transition-colors"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Main Balance Display */}
      <div className="mt-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
              {isLoading && !balance ? (
                <span className="text-slate-600 animate-pulse">000.0000</span>
              ) : (
                balance?.totalXlm || '0.0000'
              )}
            </span>
            <span className="text-lg font-bold text-emerald-400">XLM</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Available Spendable: <span className="text-slate-200 font-mono font-medium">{balance?.availableXlm || '0.0000'} XLM</span>
          </p>
        </div>

        {/* Reserve info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Base Reserve:</span>
            <span className="text-slate-200 font-mono">{balance?.baseReserve || '1.00'} XLM</span>
          </div>
          <div className="text-slate-500 hidden sm:inline">•</div>
          <div className="text-slate-400">
            Subentries: <span className="text-slate-200 font-mono">{balance?.subentryCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Account not activated banner & Friendbot activator */}
      {balance && !balance.isFunded && (
        <div className="mt-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-200">Account not activated on Testnet</p>
              <p className="text-xs text-slate-300 mt-0.5">
                Stellar accounts require a minimum reserve of 1 XLM. Use Friendbot to fund your test wallet for free.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFundFriendbot}
            isLoading={isFunding}
            className="whitespace-nowrap bg-amber-950/80 text-amber-300 border-amber-700/60 hover:bg-amber-900"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Fund with Friendbot
          </Button>
        </div>
      )}

      {/* Funding feedback message */}
      {fundingMessage && (
        <div className="mt-3 text-xs p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-300">
          {fundingMessage}
        </div>
      )}

      {/* General error message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-300">
          {error}
        </div>
      )}
    </Card>
  );
};
