'use client';

import React, { useState } from 'react';
import { PaymentReceipt } from '@agriflow/types';
import { Modal, Button, Badge } from '@agriflow/ui';
import { CheckCircle2, ExternalLink, Copy, Check, ArrowRight } from 'lucide-react';
import { shortenAddress } from '@agriflow/stellar';

export interface TransactionReceiptModalProps {
  receipt: PaymentReceipt;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyHash = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(receipt.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Receipt">
      <div className="space-y-6">
        {/* Success header */}
        <div className="text-center space-y-2 py-2">
          <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/60">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-bold text-white tracking-tight">
            Transaction Successful ✓
          </h4>
          <p className="text-xs text-slate-400">
            Settled on Stellar Testnet Ledger #{receipt.ledger}
          </p>
        </div>

        {/* Transaction details card */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">Settled Amount:</span>
            <span className="text-sm font-bold text-white font-mono">
              {receipt.amount} XLM
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">Agricultural Purpose:</span>
            <Badge variant="emerald" size="sm">
              {receipt.purpose}
            </Badge>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">Recipient:</span>
            <span className="font-mono text-slate-300 font-medium" title={receipt.destinationAccount}>
              {shortenAddress(receipt.destinationAccount, 6)}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">Sender Account:</span>
            <span className="font-mono text-slate-300 font-medium" title={receipt.sourceAccount}>
              {shortenAddress(receipt.sourceAccount, 6)}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400">Transaction Hash:</span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="font-mono text-[11px] text-slate-300 break-all bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              {receipt.hash}
            </p>
          </div>
        </div>

        {/* External Explorer Button */}
        <div className="space-y-3">
          <a
            href={receipt.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-950/40 transition-all"
          >
            <span>View on Stellar Explorer</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            className="w-full text-slate-300 hover:text-white"
          >
            Close Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};
