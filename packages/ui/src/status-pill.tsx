import React from 'react';
import { TransactionLifecycleStatus, ContractInvocationStatus } from '@agriflow/types';
import { cn } from './utils';

export type AnyTransactionStatus = TransactionLifecycleStatus | ContractInvocationStatus | string;

export interface StatusPillProps {
  status: AnyTransactionStatus;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className }) => {
  const configs: Record<
    string,
    { label: string; bg: string; dot: string; text: string; animateDot?: boolean }
  > = {
    idle: {
      label: 'Ready',
      bg: 'bg-slate-800/60 border-slate-700/60',
      dot: 'bg-slate-400',
      text: 'text-slate-300',
    },
    validating: {
      label: 'Validating Input',
      bg: 'bg-amber-950/40 border-amber-800/40',
      dot: 'bg-amber-400',
      text: 'text-amber-300',
      animateDot: true,
    },
    preparing: {
      label: 'Preparing Parameters',
      bg: 'bg-amber-950/40 border-amber-800/40',
      dot: 'bg-amber-400',
      text: 'text-amber-300',
      animateDot: true,
    },
    simulating: {
      label: 'Simulating on Soroban RPC',
      bg: 'bg-sky-950/50 border-sky-700/50',
      dot: 'bg-sky-400',
      text: 'text-sky-300',
      animateDot: true,
    },
    awaiting_approval: {
      label: 'Awaiting Wallet Approval',
      bg: 'bg-sky-950/50 border-sky-700/50',
      dot: 'bg-sky-400',
      text: 'text-sky-300',
      animateDot: true,
    },
    awaiting_signature: {
      label: 'Awaiting Wallet Signature',
      bg: 'bg-sky-950/50 border-sky-700/50',
      dot: 'bg-sky-400',
      text: 'text-sky-300',
      animateDot: true,
    },
    submitting: {
      label: 'Submitting to Testnet',
      bg: 'bg-purple-950/50 border-purple-700/50',
      dot: 'bg-purple-400',
      text: 'text-purple-300',
      animateDot: true,
    },
    pending: {
      label: 'Confirming On-Chain',
      bg: 'bg-amber-950/60 border-amber-700/60',
      dot: 'bg-amber-400',
      text: 'text-amber-200',
      animateDot: true,
    },
    confirmed: {
      label: 'Confirmed on Stellar Testnet',
      bg: 'bg-emerald-950/60 border-emerald-700/60',
      dot: 'bg-emerald-400',
      text: 'text-emerald-300',
    },
    success: {
      label: 'Confirmed on Stellar Testnet',
      bg: 'bg-emerald-950/60 border-emerald-700/60',
      dot: 'bg-emerald-400',
      text: 'text-emerald-300',
    },
    rejected: {
      label: 'Signature Rejected by User',
      bg: 'bg-slate-800/60 border-slate-700/60',
      dot: 'bg-slate-400',
      text: 'text-slate-400',
    },
    failed: {
      label: 'Transaction Failed',
      bg: 'bg-red-950/60 border-red-700/60',
      dot: 'bg-red-400',
      text: 'text-red-300',
    },
  };

  const conf = configs[status] || configs.idle;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-sm',
        conf.bg,
        conf.text,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {conf.animateDot && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', conf.dot)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', conf.dot)} />
      </span>
      <span>{conf.label}</span>
    </div>
  );
};
