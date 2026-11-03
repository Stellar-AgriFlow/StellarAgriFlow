'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export const OfflineStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setLastSyncTime(new Date().toLocaleTimeString());
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !isSyncing) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 px-3.5 py-2 rounded-2xl border backdrop-blur-md shadow-lg flex items-center gap-2.5 text-xs transition-all ${
        !isOnline
          ? 'bg-amber-950/80 border-amber-600/40 text-amber-200'
          : 'bg-emerald-950/80 border-emerald-600/40 text-emerald-200'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Offline Mode Active · Cached Data Served (Last Sync: {lastSyncTime})</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
          <span>Synchronizing cached farmer transactions with Stellar...</span>
        </>
      )}
    </div>
  );
};
