'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Modal, Button, Badge } from '@agriflow/ui';
import { Wallet, ExternalLink, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { WalletProvider } from '@agriflow/types';

export const WalletModal: React.FC = () => {
  const {
    isWalletModalOpen,
    closeWalletModal,
    availableWallets,
    connect,
    state,
  } = useWallet();

  const [connectingId, setConnectingId] = useState<WalletProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelect = async (walletId: WalletProvider) => {
    setConnectingId(walletId);
    setErrorMessage(null);
    try {
      await connect(walletId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection failed.');
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <Modal
      isOpen={isWalletModalOpen}
      onClose={() => {
        setErrorMessage(null);
        closeWalletModal();
      }}
      title="Connect Stellar Wallet"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Connect your preferred non-custodial Stellar wallet to access the AgriFlow agricultural payment and Farm Passport protocol on Stellar Testnet.
        </p>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <div className="space-y-2.5">
          {availableWallets.map((wallet) => {
            const isConnecting = connectingId === wallet.id;
            return (
              <div
                key={wallet.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 hover:border-emerald-600/50 bg-slate-950/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100">
                        {wallet.name}
                      </span>
                      {wallet.isAvailable && (
                        <Badge variant="emerald" size="sm">
                          Detected
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-xs line-clamp-1">
                      {wallet.description}
                    </p>
                  </div>
                </div>

                <div>
                  {wallet.isAvailable ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSelect(wallet.id)}
                      isLoading={isConnecting}
                      disabled={Boolean(connectingId)}
                      className="text-xs py-1.5 px-3.5"
                    >
                      Connect
                    </Button>
                  ) : (
                    <a
                      href={wallet.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-800/60 bg-emerald-950/30 hover:bg-emerald-900/40 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Install
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-400">
          Need testnet XLM? Switch your wallet network to <strong className="text-slate-300">Testnet</strong> and fund via Friendbot.
        </div>
      </div>
    </Modal>
  );
};
