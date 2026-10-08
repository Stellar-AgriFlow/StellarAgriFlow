'use client';

import { useState, useEffect, useCallback } from 'react';
import { AccountBalance } from '@agriflow/types';
import { fetchAccountBalance, parseStellarError } from '@agriflow/stellar';

export function useAccountBalance(publicKey: string | null | undefined) {
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAccountBalance(publicKey);
      setBalance(data);
    } catch (err: any) {
      const parsed = parseStellarError(err);
      setError(parsed);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refresh: fetchBalance,
  };
}
