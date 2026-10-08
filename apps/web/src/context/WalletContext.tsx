'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WalletState, IWalletAdapter, WalletProvider as WalletProviderType, WalletOption } from '@agriflow/types';
import { shortenAddress } from '@agriflow/stellar';
import {
  defaultWalletAdapter,
  getAdapterForProvider,
  SUPPORTED_WALLETS,
} from '../services/walletAdapter';

interface WalletContextValue {
  state: WalletState;
  adapter: IWalletAdapter;
  availableWallets: WalletOption[];
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connect: (provider?: WalletProviderType) => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<string>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY = 'agriflow_wallet_connected';
const PROVIDER_KEY = 'agriflow_wallet_provider';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adapter, setAdapter] = useState<IWalletAdapter>(defaultWalletAdapter);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletOption[]>(SUPPORTED_WALLETS);

  const [state, setState] = useState<WalletState>({
    status: 'checking',
    account: null,
    error: null,
    isAvailable: false,
    selectedProvider: 'FREIGHTER',
  });

  // Check extensions on mount
  useEffect(() => {
    let mounted = true;

    async function checkWallets() {
      const updated = await Promise.all(
        SUPPORTED_WALLETS.map(async (w) => {
          try {
            const ad = getAdapterForProvider(w.id);
            const isAvail = await ad.isAvailable();
            return { ...w, isAvailable: isAvail };
          } catch {
            return { ...w, isAvailable: false };
          }
        })
      );

      if (mounted) {
        setAvailableWallets(updated);
      }

      // Check auto-reconnect
      const wasConnected = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true';
      const storedProvider = (typeof window !== 'undefined' ? localStorage.getItem(PROVIDER_KEY) : 'FREIGHTER') as WalletProviderType;
      const initialAdapter = getAdapterForProvider(storedProvider || 'FREIGHTER');
      setAdapter(initialAdapter);

      if (wasConnected && initialAdapter) {
        try {
          const pubKey = await initialAdapter.getPublicKey();
          if (pubKey && mounted) {
            setState({
              status: 'connected',
              account: {
                address: pubKey,
                shortAddress: shortenAddress(pubKey),
              },
              error: null,
              isAvailable: true,
              selectedProvider: storedProvider,
            });
            return;
          }
        } catch {
          // Fall through
        }
      }

      if (mounted) {
        setState({
          status: 'disconnected',
          account: null,
          error: null,
          isAvailable: true,
          selectedProvider: storedProvider,
        });
      }
    }

    checkWallets();

    return () => {
      mounted = false;
    };
  }, []);

  const connect = useCallback(async (provider: WalletProviderType = 'FREIGHTER') => {
    const selectedAdapter = getAdapterForProvider(provider);
    setAdapter(selectedAdapter);

    setState((prev) => ({
      ...prev,
      status: 'connecting',
      error: null,
      selectedProvider: provider,
    }));

    try {
      const address = await selectedAdapter.connect();
      if (!address) {
        throw new Error('No address received from wallet');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, 'true');
        localStorage.setItem(PROVIDER_KEY, provider);
      }

      setState({
        status: 'connected',
        account: {
          address,
          shortAddress: shortenAddress(address),
        },
        error: null,
        isAvailable: true,
        selectedProvider: provider,
      });

      setIsWalletModalOpen(false);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect wallet';
      const isNotInstalled = errorMsg.includes('not detected') || errorMsg.includes('install');

      setState((prev) => ({
        ...prev,
        status: isNotInstalled ? 'not-installed' : 'error',
        error: errorMsg,
      }));
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await adapter.disconnect();
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROVIDER_KEY);
      }
      setState((prev) => ({
        ...prev,
        status: 'disconnected',
        account: null,
        error: null,
      }));
    }
  }, [adapter]);

  const signTransaction = useCallback(
    async (xdr: string, opts?: { networkPassphrase?: string }) => {
      return await adapter.signTransaction(xdr, opts);
    },
    [adapter]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <WalletContext.Provider
      value={{
        state,
        adapter,
        availableWallets,
        isWalletModalOpen,
        openWalletModal: () => setIsWalletModalOpen(true),
        closeWalletModal: () => setIsWalletModalOpen(false),
        connect,
        disconnect,
        signTransaction,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return ctx;
}
