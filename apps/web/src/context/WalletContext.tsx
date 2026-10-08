'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WalletState, IWalletAdapter } from '@agriflow/types';
import { shortenAddress } from '@agriflow/stellar';
import { defaultWalletAdapter, previewWalletAdapter } from '../services/walletAdapter';

interface WalletContextValue {
  state: WalletState;
  adapter: IWalletAdapter;
  connect: (type?: 'freighter' | 'testnet_demo') => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<string>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const STORAGE_KEY = 'agriflow_wallet_connected';
const ADAPTER_KEY = 'agriflow_wallet_adapter';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adapter, setAdapter] = useState<IWalletAdapter>(defaultWalletAdapter);
  const [state, setState] = useState<WalletState>({
    status: 'checking',
    account: null,
    error: null,
    isAvailable: false,
  });

  // Check wallet extension availability on mount
  useEffect(() => {
    let mounted = true;

    async function checkAvailability() {
      try {
        const storedAdapter = typeof window !== 'undefined' ? localStorage.getItem(ADAPTER_KEY) : null;
        const currentAdapter = storedAdapter === 'testnet_demo' ? previewWalletAdapter : defaultWalletAdapter;
        setAdapter(currentAdapter);

        const available = await currentAdapter.isAvailable();
        if (!mounted) return;

        const wasConnected = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true';

        if (available && wasConnected) {
          try {
            const pubKey = await currentAdapter.getPublicKey();
            if (pubKey && mounted) {
              setState({
                status: 'connected',
                account: {
                  address: pubKey,
                  shortAddress: shortenAddress(pubKey),
                },
                error: null,
                isAvailable: true,
              });
              return;
            }
          } catch {
            // Fallback to disconnected
          }
        }

        setState({
          status: 'disconnected',
          account: null,
          error: null,
          isAvailable: available,
        });
      } catch (err: any) {
        if (!mounted) return;
        setState({
          status: 'disconnected',
          account: null,
          error: null,
          isAvailable: false,
        });
      }
    }

    checkAvailability();

    return () => {
      mounted = false;
    };
  }, []);

  const connect = useCallback(async (type?: 'freighter' | 'testnet_demo') => {
    const selectedAdapter = type === 'testnet_demo' ? previewWalletAdapter : defaultWalletAdapter;
    setAdapter(selectedAdapter);

    setState((prev) => ({ ...prev, status: 'connecting', error: null }));
    try {
      const address = await selectedAdapter.connect();
      if (!address) {
        throw new Error('No address received from wallet');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, 'true');
        localStorage.setItem(ADAPTER_KEY, type || 'freighter');
      }

      setState({
        status: 'connected',
        account: {
          address,
          shortAddress: shortenAddress(address),
        },
        error: null,
        isAvailable: true,
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect wallet';
      const isNotInstalled = errorMsg.includes('not detected');

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
        localStorage.removeItem(ADAPTER_KEY);
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
