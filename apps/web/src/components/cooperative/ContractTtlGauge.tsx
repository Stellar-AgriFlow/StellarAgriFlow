'use client';

import React, { useState } from 'react';
import { EntryTtlStatus, LedgerTtlTracker } from '../../../../../packages/contracts-client/src/ledgerTtlTracker';

export interface ContractTtlGaugeProps {
  contractName: string;
  contractId: string;
  currentLedger: number;
  liveUntilLedger: number;
  onBumpTtl?: (bumpLedgers: number) => Promise<void>;
}

export const ContractTtlGauge: React.FC<ContractTtlGaugeProps> = ({
  contractName,
  contractId,
  currentLedger,
  liveUntilLedger,
  onBumpTtl,
}) => {
  const [bumping, setBumping] = useState(false);
  const [bumpSuccess, setBumpSuccess] = useState(false);

  const status: EntryTtlStatus = LedgerTtlTracker.evaluateTtl(
    contractId,
    'instance',
    currentLedger,
    liveUntilLedger
  );

  // Stellar 5-second ledger approx: 1 hour = 720 ledgers, 1 day = 17,280 ledgers
  const daysRemaining = (status.remainingLedgers / 17280).toFixed(1);
  const hoursRemaining = (status.remainingLedgers / 720).toFixed(1);

  const handleBump = async () => {
    if (!onBumpTtl) return;
    try {
      setBumping(true);
      await onBumpTtl(LedgerTtlTracker.DEFAULT_BUMP_AMOUNT_LEDGERS);
      setBumpSuccess(true);
      setTimeout(() => setBumpSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to bump TTL', err);
    } finally {
      setBumping(false);
    }
  };

  const getBadgeStyle = () => {
    if (status.isExpired) return 'bg-red-900/60 text-red-300 border-red-500/50';
    if (status.isExpiringSoon) return 'bg-amber-900/60 text-amber-300 border-amber-500/50';
    return 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50';
  };

  const getStatusText = () => {
    if (status.isExpired) return 'EXPIRED (ARCHIVED)';
    if (status.isExpiringSoon) return 'ACTION REQUIRED: EXPIRING SOON';
    return 'HEALTHY STORAGE TTL';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            {contractName} TTL Health
          </h4>
          <span
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded-full border ${getBadgeStyle()}`}
          >
            {getStatusText()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 my-3 text-sm">
          <div className="bg-slate-800/60 rounded-lg p-3">
            <span className="text-xs text-slate-400 block mb-1">Remaining Ledgers</span>
            <span className="text-lg font-mono font-bold text-white">
              {status.remainingLedgers.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3">
            <span className="text-xs text-slate-400 block mb-1">Estimated Lifespan</span>
            <span className="text-lg font-mono font-bold text-slate-100">
              {status.remainingLedgers > 17280 ? `${daysRemaining} days` : `${hoursRemaining} hrs`}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono truncate">
          Contract ID: <span className="text-slate-300">{contractId}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Target liveUntil: #{(currentLedger + LedgerTtlTracker.DEFAULT_BUMP_AMOUNT_LEDGERS).toLocaleString()}
        </span>
        <button
          onClick={handleBump}
          disabled={bumping}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            status.isExpiringSoon
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
          } disabled:opacity-50`}
        >
          {bumping ? 'Extending TTL...' : bumpSuccess ? 'Bump Extended!' : 'Extend Storage TTL'}
        </button>
      </div>
    </div>
  );
};
