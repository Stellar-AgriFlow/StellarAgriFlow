'use client';

import React, { useState } from 'react';
import { Landmark, Users, Plus, PiggyBank, ArrowDownLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import { BulkProcurementProposal, ProposalStatus, SubmitProposalParams } from '@agriflow/types';
import { ProposalCard } from '../../components/cooperative/ProposalCard';
import { CreateProposalModal } from '../../components/cooperative/CreateProposalModal';

const MOCK_PROPOSALS: BulkProcurementProposal[] = [
  {
    id: 1,
    proposer: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
    title: 'Bulk NPK 15-15-15 Fertilizer Q1 Procurement',
    recipient: 'GCAGRISUPPLIER001AGRICO999STELLARKEY',
    amount: 14500,
    votesFor: 65,
    quorumRequired: 51,
    status: ProposalStatus.Approved,
  },
  {
    id: 2,
    proposer: 'GDMILLER32491OKLNASDUFHWENLKSDFKLJ',
    title: 'Certified Drought-Resistant Maize Seed Stock',
    recipient: 'GCSEEDCORP002HARVEST777STELLARKEY',
    amount: 8200,
    votesFor: 38,
    quorumRequired: 51,
    status: ProposalStatus.Pending,
  },
  {
    id: 3,
    proposer: 'GCORGFARMER555KLSADJFOEWIRUDKL99',
    title: 'Solar Irrigation Pump Collective Leasing',
    recipient: 'GCSOLARPUMPS003ENERGY888STELLARKEY',
    amount: 19800,
    votesFor: 72,
    quorumRequired: 51,
    status: ProposalStatus.Executed,
  },
];

export default function CooperativeDashboardPage() {
  const [proposals, setProposals] = useState<BulkProcurementProposal[]>(MOCK_PROPOSALS);
  const [treasuryBalance, setTreasuryBalance] = useState<number>(45000);
  const [userSavings, setUserSavings] = useState<number>(3200);
  const [userShares] = useState<number>(15);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'executed'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleVote = async (proposalId: number) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === proposalId) {
          const newVotes = p.votesFor + userShares;
          const isApproved = newVotes >= p.quorumRequired;
          return {
            ...p,
            votesFor: newVotes,
            status: isApproved ? ProposalStatus.Approved : p.status,
          };
        }
        return p;
      })
    );
    setActionNotice(`Successfully cast ${userShares} voting shares for Proposal #${proposalId}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleExecute = async (proposalId: number) => {
    const target = proposals.find((p) => p.id === proposalId);
    if (!target) return;

    setTreasuryBalance((prev) => Math.max(0, prev - target.amount));
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: ProposalStatus.Executed } : p))
    );
    setActionNotice(`Proposal #${proposalId} executed. ${target.amount.toLocaleString()} USDC disbursed from treasury.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleCreateProposal = async (params: SubmitProposalParams) => {
    const newProp: BulkProcurementProposal = {
      id: proposals.length + 1,
      proposer: params.proposer,
      title: params.title,
      recipient: params.recipient,
      amount: params.amount,
      votesFor: 0,
      quorumRequired: 51,
      status: ProposalStatus.Pending,
    };
    setProposals([newProp, ...proposals]);
    setActionNotice(`Proposal #${newProp.id} submitted to quorum voting.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredProposals = proposals.filter((p) => {
    if (filter === 'pending') return p.status === ProposalStatus.Pending;
    if (filter === 'approved') return p.status === ProposalStatus.Approved;
    if (filter === 'executed') return p.status === ProposalStatus.Executed;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Soroban Cooperative Treasury
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Landmark className="w-8 h-8 text-emerald-400" />
              Farmer Cooperative Treasury & Procurement
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Decentralized multi-sig treasury for bulk input purchases, shared savings, and transparent voting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950 transition"
            >
              <Plus className="w-4 h-4" />
              New Procurement Proposal
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-600/40 rounded-xl flex items-center gap-3 text-sm text-emerald-300">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Collective Treasury</span>
              <PiggyBank className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {treasuryBalance.toLocaleString()} <span className="text-sm font-normal text-slate-400">USDC</span>
            </div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% On-Chain Reserve
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Your Staked Savings</span>
              <ArrowDownLeft className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {userSavings.toLocaleString()} <span className="text-sm font-normal text-slate-400">USDC</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Yield: 6.4% APY Seasonal
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Voting Shares</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {userShares} <span className="text-sm font-normal text-slate-400">/ 100 Shares</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Weighted by Staked Capital
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Quorum Threshold</span>
              <Landmark className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              51% <span className="text-sm font-normal text-slate-400">Supermajority</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Soroban Governance Rule
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {(['all', 'pending', 'approved', 'executed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filter === tab
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'pending' ? 'Voting Active' : tab}
            </button>
          ))}
        </div>

        {/* Proposals List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              userShares={userShares}
              onVote={handleVote}
              onExecute={handleExecute}
              isAdmin={true}
            />
          ))}
        </div>

        {/* Create Proposal Modal */}
        <CreateProposalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateProposal}
          treasuryBalance={treasuryBalance}
          proposerAddress="GBBCOOPFARMER89712KLSADJFOEWIRUDKL"
        />
      </div>
    </div>
  );
}
