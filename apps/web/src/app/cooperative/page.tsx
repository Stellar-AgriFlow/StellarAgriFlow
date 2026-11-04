'use client';

import React, { useState } from 'react';
import { Landmark, Users, Plus, PiggyBank, ArrowDownLeft, ShieldCheck, CheckCircle, Network } from 'lucide-react';
import { BulkProcurementProposal, ProposalStatus, SubmitProposalParams } from '@agriflow/types';
import { ProposalCard } from '../../components/cooperative/ProposalCard';
import { CreateProposalModal } from '../../components/cooperative/CreateProposalModal';
import { DepositSavingsModal } from '../../components/cooperative/DepositSavingsModal';
import { WithdrawSavingsModal } from '../../components/cooperative/WithdrawSavingsModal';
import { DividendDistributionModal } from '../../components/cooperative/DividendDistributionModal';
import { ClaimableEscrowCard, ClaimableEscrowItem } from '../../components/cooperative/ClaimableEscrowCard';
import { MultiSigStatusBadge } from '../../components/cooperative/MultiSigStatusBadge';
import { ContractTtlGauge } from '../../components/cooperative/ContractTtlGauge';
import { CrossContractTraceModal } from '../../components/cooperative/CrossContractTraceModal';
import { CarbonOffsetBadge } from '../../components/cooperative/CarbonOffsetBadge';
import { EmergencyPauseControl, ModulePauseItem } from '../../components/cooperative/EmergencyPauseControl';
import { ProofOfReserveBanner } from '../../components/cooperative/ProofOfReserveBanner';
import { ContractModule } from '../../../../../packages/contracts-client/src/emergencyPauseManager';
import { CrossContractInvocationNode, InvocationTraceSummary } from '../../../../../packages/contracts-client/src/crossContractAdapter';

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
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDividendOpen, setIsDividendOpen] = useState(false);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(10000);
  const [multiSigWeight, setMultiSigWeight] = useState<number>(2);
  const [hasUserSignedMultiSig, setHasUserSignedMultiSig] = useState<boolean>(false);
  const [currentLedger, setCurrentLedger] = useState<number>(154000);
  const [liveUntilLedger, setLiveUntilLedger] = useState<number>(205840);
  const [carbonBalance, setCarbonBalance] = useState<number>(45);
  const [pauseModules, setPauseModules] = useState<ModulePauseItem[]>([
    { module: 'TREASURY', label: 'Treasury Vault', isPaused: false },
    { module: 'LENDING', label: 'Seasonal Microloans', isPaused: false },
    { module: 'MARKETPLACE', label: 'Crop Marketplace', isPaused: false },
    { module: 'ESCROW', label: 'Delivery Escrow', isPaused: false },
    { module: 'LIQUIDATION', label: 'Collateral Liquidation', isPaused: false },
    { module: 'INSURANCE', label: 'Weather Insurance', isPaused: false },
  ]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'executed'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleToggleModulePause = async (module: ContractModule, shouldPause: boolean) => {
    setPauseModules((prev) =>
      prev.map((m) => (m.module === module ? { ...m, isPaused: shouldPause } : m))
    );
    setActionNotice(
      shouldPause
        ? `EMERGENCY ALERT: Module ${module} has been paused by guardian.`
        : `Module ${module} operational status resumed.`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRetireCarbonCredits = async (tons: number) => {
    setCarbonBalance((prev) => Math.max(0, prev - tons));
    setActionNotice(`Successfully retired ${tons} tons CO2e on Soroban SAC burn! Certificate issued.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleBumpTtl = async (bumpAmount: number) => {
    setLiveUntilLedger((prev) => prev + bumpAmount);
    setActionNotice(`Soroban storage TTL successfully extended by ${bumpAmount.toLocaleString()} ledgers!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const [escrows, setEscrows] = useState<ClaimableEscrowItem[]>([
    {
      id: 'CB-8921',
      title: 'Certified Seed Delivery Escrow (72h Inspection)',
      amount: 8200,
      assetCode: 'USDC',
      sponsor: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
      claimant: 'GCSEEDCORP002HARVEST777STELLARKEY',
      unlockTimestamp: Math.floor(Date.now() / 1000) - 3600,
      status: 'READY_TO_CLAIM',
    },
    {
      id: 'CB-9410',
      title: 'Tractor Fleet Seasonal Lease Deposit',
      amount: 14500,
      assetCode: 'USDC',
      sponsor: 'GBBCOOPFARMER89712KLSADJFOEWIRUDKL',
      claimant: 'GCTRACTORLEASE888MACHINERYSTELLARKEY',
      unlockTimestamp: Math.floor(Date.now() / 1000) + 86400 * 5,
      status: 'LOCKED',
    },
  ]);

  const handleClaimEscrow = async (id: string) => {
    setEscrows((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'CLAIMED' } : e))
    );
    setActionNotice(`Claimed conditional balance ${id}. Funds settled to claimant wallet.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDistributeDividends = async (totalPool: number) => {
    setTreasuryBalance((prev) => Math.max(0, prev - totalPool));
    setActionNotice(`Successfully disbursed ${totalPool.toLocaleString()} USDC in batch dividends to all active cooperative stakers.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleDeposit = async (amount: number) => {
    setWalletBalance((prev) => Math.max(0, prev - amount));
    setUserSavings((prev) => prev + amount);
    setTreasuryBalance((prev) => prev + amount);
    setActionNotice(`Staked ${amount.toLocaleString()} USDC into cooperative treasury.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleWithdraw = async (amount: number) => {
    setUserSavings((prev) => Math.max(0, prev - amount));
    setWalletBalance((prev) => prev + amount);
    setTreasuryBalance((prev) => Math.max(0, prev - amount));
    setActionNotice(`Withdrew ${amount.toLocaleString()} USDC from cooperative treasury.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSignMultiSigEnvelope = async () => {
    setMultiSigWeight((prev) => prev + 1);
    setHasUserSignedMultiSig(true);
    setActionNotice('Multi-sig signature appended to pending transaction envelope.');
    setTimeout(() => setActionNotice(null), 4000);
  };

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
              onClick={() => setIsTraceOpen(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-sm font-semibold flex items-center gap-2 border border-slate-800 transition"
            >
              <Network className="w-4 h-4 text-emerald-400" />
              Trace Call DAG
            </button>
            <button
              onClick={() => setIsDividendOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-amber-950 transition"
            >
              Distribute Dividends
            </button>
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

        {/* Proof of Reserve Silo Solvency Banner */}
        <ProofOfReserveBanner
          commoditySymbol="MAIZE"
          circulatingTokens={3000}
          physicalSiloTonnes={3250}
          collateralizationRatioPercent={108.3}
          lastAuditedTimestamp={Math.floor(Date.now() / 1000) - 86400 * 2}
          silosCount={3}
        />

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

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
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
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsDepositOpen(true)}
                className="flex-1 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
              >
                + Stake
              </button>
              <button
                onClick={() => setIsWithdrawOpen(true)}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Withdraw
              </button>
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

        {/* Multi-Sig Status Tracker */}
        <MultiSigStatusBadge
          collectedWeight={multiSigWeight}
          requiredWeight={3}
          isSigner={true}
          hasUserSigned={hasUserSignedMultiSig}
          onSign={handleSignMultiSigEnvelope}
        />

        {/* Emergency Guardian Module Pause Control */}
        <EmergencyPauseControl
          isGuardian={true}
          modules={pauseModules}
          onTogglePause={handleToggleModulePause}
        />

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

        {/* Contract State & Carbon Offsets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <ContractTtlGauge
            contractName="Soroban Cooperative Vault"
            contractId="CACOOPVAULTA4GRICULTURESTREASURYSTK6QUORUMVOTING88888888"
            currentLedger={currentLedger}
            liveUntilLedger={liveUntilLedger}
            onBumpTtl={handleBumpTtl}
          />
          <CarbonOffsetBadge
            farmName="Eldoret Agroforestry Co-op Farm"
            hectares={35}
            practice="Agroforestry & No-Till"
            verifiedTonsCo2={147}
            tokenBalance={carbonBalance}
            onRetireCredits={handleRetireCarbonCredits}
          />
        </div>

        {/* Time-Locked Claimable Escrows */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              Time-Locked Supplier Escrows (Stellar Claimable Balances)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Conditional escrow balances governed by on-chain absolute and relative time predicates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {escrows.map((item) => (
              <ClaimableEscrowCard
                key={item.id}
                item={item}
                onClaim={handleClaimEscrow}
              />
            ))}
          </div>
        </div>

        {/* Create Proposal Modal */}
        <CreateProposalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateProposal}
          treasuryBalance={treasuryBalance}
          proposerAddress="GBBCOOPFARMER89712KLSADJFOEWIRUDKL"
        />

        {/* Deposit Savings Modal */}
        <DepositSavingsModal
          isOpen={isDepositOpen}
          onClose={() => setIsDepositOpen(false)}
          onDeposit={handleDeposit}
          walletBalance={walletBalance}
        />

        {/* Withdraw Savings Modal */}
        <WithdrawSavingsModal
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          onWithdraw={handleWithdraw}
          stakedBalance={userSavings}
        />

        {/* Dividend Distribution Modal */}
        <DividendDistributionModal
          isOpen={isDividendOpen}
          onClose={() => setIsDividendOpen(false)}
          onDistribute={handleDistributeDividends}
          treasuryBalance={treasuryBalance}
        />

        {/* Cross-Contract Call DAG Trace Modal */}
        <CrossContractTraceModal
          isOpen={isTraceOpen}
          onClose={() => setIsTraceOpen(false)}
          rootNode={{
            id: 'call_1',
            contractId: 'CACOOPVAULTA4GRICULTURESTREASURYSTK6QUORUMVOTING88888888',
            contractName: 'CooperativeVault',
            functionName: 'execute_bulk_procurement',
            args: ['PROPOSAL-1', 14500],
            depth: 0,
            cpuInstructionsUsed: 310000,
            memoryBytesUsed: 6144,
            status: 'SUCCESS',
            children: [
              {
                id: 'call_2',
                contractId: 'CESCROW222222222222222222222222222222222222222222222222222',
                contractName: 'AgriculturalEscrow',
                functionName: 'lock_procurement_payment',
                args: [14500],
                depth: 1,
                cpuInstructionsUsed: 145000,
                memoryBytesUsed: 3072,
                status: 'SUCCESS',
                children: [],
              },
              {
                id: 'call_3',
                contractId: 'CWAREHOUSE333333333333333333333333333333333333333333333333',
                contractName: 'WarehouseReceipt',
                functionName: 'reserve_batch_allocation',
                args: ['BATCH-NPK-Q1'],
                depth: 1,
                cpuInstructionsUsed: 180000,
                memoryBytesUsed: 4096,
                status: 'SUCCESS',
                children: [],
              },
            ],
          }}
          summary={{
            rootContractId: 'CACOOPVAULTA4GRICULTURESTREASURYSTK6QUORUMVOTING88888888',
            totalNodes: 3,
            maxDepth: 1,
            totalCpuInstructions: 635000,
            totalMemoryBytes: 13312,
            hasFailures: false,
            involvedContracts: [
              'CACOOPVAULTA4GRICULTURESTREASURYSTK6QUORUMVOTING88888888',
              'CESCROW222222222222222222222222222222222222222222222222222',
              'CWAREHOUSE333333333333333333333333333333333333333333333333',
            ],
          }}
        />
      </div>
    </div>
  );
}
