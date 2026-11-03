'use client';

import React from 'react';
import { Users, CheckCircle2, AlertCircle, ArrowUpRight, Vote } from 'lucide-react';
import { BulkProcurementProposal, ProposalStatus } from '@agriflow/types';

interface ProposalCardProps {
  proposal: BulkProcurementProposal;
  userShares?: number;
  onVote: (proposalId: number) => Promise<void>;
  onExecute: (proposalId: number) => Promise<void>;
  isAdmin?: boolean;
  isVoting?: boolean;
  isExecuting?: boolean;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  userShares = 0,
  onVote,
  onExecute,
  isAdmin = false,
  isVoting = false,
  isExecuting = false,
}) => {
  const percentComplete = Math.min(
    100,
    Math.round((proposal.votesFor / (proposal.quorumRequired || 1)) * 100)
  );

  const getStatusBadge = () => {
    switch (proposal.status) {
      case ProposalStatus.Pending:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Voting Active
          </span>
        );
      case ProposalStatus.Approved:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case ProposalStatus.Executed:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Executed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl hover:border-slate-700 transition duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-emerald-400">PROP #{proposal.id}</span>
            {getStatusBadge()}
          </div>
          <h3 className="text-lg font-bold text-white">{proposal.title}</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Proposer: {proposal.proposer ? `${proposal.proposer.slice(0, 6)}...${proposal.proposer.slice(-4)}` : 'Cooperative Member'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-400">Disbursement</div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {proposal.amount.toLocaleString()} USDC
          </div>
        </div>
      </div>

      {/* Quorum Progress */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Quorum Progress</span>
          <span className="font-semibold text-slate-200">
            {proposal.votesFor} / {proposal.quorumRequired} shares ({percentComplete}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users className="w-4 h-4 text-slate-500" />
          <span>Your Voting Shares: <strong className="text-white">{userShares}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {proposal.status === ProposalStatus.Pending && (
            <button
              onClick={() => onVote(proposal.id)}
              disabled={isVoting || userShares === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Vote className="w-3.5 h-3.5" />
              {isVoting ? 'Casting...' : 'Vote For'}
            </button>
          )}

          {proposal.status === ProposalStatus.Approved && isAdmin && (
            <button
              onClick={() => onExecute(proposal.id)}
              disabled={isExecuting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              {isExecuting ? 'Executing...' : 'Disburse Treasury'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
