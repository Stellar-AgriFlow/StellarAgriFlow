'use client';

import React, { useState } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';
import { SubmitProposalParams } from '@agriflow/types';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: SubmitProposalParams) => Promise<void>;
  treasuryBalance: number;
  proposerAddress: string;
}

export const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  treasuryBalance,
  proposerAddress,
}) => {
  const [title, setTitle] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Please provide a descriptive proposal title.');
      return;
    }
    if (!recipient.trim().startsWith('G') || recipient.trim().length !== 56) {
      setError('Please enter a valid Stellar public key for the recipient supplier.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (parsedAmount > treasuryBalance) {
      setError(`Requested amount exceeds available treasury balance of ${treasuryBalance.toLocaleString()} USDC.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        proposer: proposerAddress,
        title: title.trim(),
        recipient: recipient.trim(),
        amount: parsedAmount,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit proposal.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">
          Submit Bulk Procurement Proposal
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Request funds from the cooperative treasury for collective agricultural inputs.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Proposal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bulk NPK Fertilizer Q1 Order"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Supplier Stellar Address (G...)
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="GD53J89Z..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Amount (USDC)
              </label>
              <span className="text-xs text-slate-400">
                Treasury: {treasuryBalance.toLocaleString()} USDC
              </span>
            </div>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Submitting...' : 'Submit to Quorum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
