'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { defaultFinanceClient } from '@agriflow/contracts-client';
import {
  FinancingRequest,
  CreateFinancingRequestParams,
  ContractInvocationStatus,
  FarmPassport,
} from '@agriflow/types';
import { Card, Button, Badge, StatusPill } from '@agriflow/ui';
import {
  Coins,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { getTxExplorerUrl, shortenAddress } from '@agriflow/stellar';

interface FinancingSectionProps {
  passports: FarmPassport[];
  onRequestCreated?: (request: FinancingRequest) => void;
}

export function FinancingSection({ passports, onRequestCreated }: FinancingSectionProps) {
  const { state: walletState, signTransaction } = useWallet();
  const isConnected = walletState.status === 'connected' && Boolean(walletState.account);

  // Form state
  const [selectedFarmId, setSelectedFarmId] = useState(
    passports[0]?.farmId || 'AGRI-000001'
  );
  const [requestedAmount, setRequestedAmount] = useState('1500');
  const [purpose, setPurpose] = useState('High-Yield Seedlings & Organic Fertilizer');
  const [durationDays, setDurationDays] = useState('90');
  const [interestPercent, setInterestPercent] = useState('6.5');

  // Invocation state
  const [txStatus, setTxStatus] = useState<ContractInvocationStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sample on-chain financing requests list
  const [requests, setRequests] = useState<FinancingRequest[]>([
    {
      requestId: 101,
      farmId: 'AGRI-000001',
      farmer: 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
      requestedAmount: '20000000000',
      requestedAmountXlm: 2000,
      fundingAsset: 'XLM',
      purpose: 'Drip Irrigation Infrastructure',
      expectedRepaymentAmount: '21300000000',
      expectedRepaymentXlm: 2130,
      durationDays: 120,
      status: 'Funded',
      funder: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      createdAt: Date.now() - 86400000 * 3,
      fundedAt: Date.now() - 86400000 * 2,
    },
    {
      requestId: 102,
      farmId: 'AGRI-000002',
      farmer: walletState.account?.address || 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
      requestedAmount: '12000000000',
      requestedAmountXlm: 1200,
      fundingAsset: 'XLM',
      purpose: 'Cold Chain Storage Maintenance',
      expectedRepaymentAmount: '12720000000',
      expectedRepaymentXlm: 1272,
      durationDays: 90,
      status: 'Requested',
      createdAt: Date.now() - 86400000,
    },
  ]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletState.account) {
      setErrorMessage('Please connect your wallet first.');
      return;
    }

    const amountNum = parseFloat(requestedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Please enter a valid financing amount.');
      return;
    }

    setErrorMessage(null);
    setTxStatus('preparing');

    const params: CreateFinancingRequestParams = {
      farmId: selectedFarmId,
      farmer: walletState.account.address,
      requestedAmountXlm: amountNum,
      purpose,
      durationDays: parseInt(durationDays, 10) || 90,
      interestRatePercent: parseFloat(interestPercent) || 5.0,
    };

    try {
      const result = await defaultFinanceClient.createFinancingRequest(
        params,
        signTransaction,
        (state) => setTxStatus(state as ContractInvocationStatus)
      );

      if (result.successful && result.txHash) {
        setTxHash(result.txHash);
        setTxStatus('confirmed');

        const newReq: FinancingRequest = {
          requestId: result.requestId || Math.floor(Math.random() * 900) + 100,
          farmId: selectedFarmId,
          farmer: walletState.account.address,
          requestedAmount: (amountNum * 10000000).toString(),
          requestedAmountXlm: amountNum,
          fundingAsset: 'XLM',
          purpose,
          expectedRepaymentAmount: (amountNum * 1.065 * 10000000).toString(),
          expectedRepaymentXlm: amountNum * 1.065,
          durationDays: parseInt(durationDays, 10),
          status: 'Requested',
          createdAt: Date.now(),
          txHash: result.txHash,
        };

        setRequests((prev) => [newReq, ...prev]);
        onRequestCreated?.(newReq);
      } else {
        setErrorMessage(result.error || 'Financing request failed.');
        setTxStatus('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction was rejected or failed.');
      setTxStatus('failed');
    }
  };

  const handleFundRequest = async (req: FinancingRequest) => {
    if (!walletState.account) return;
    setTxStatus('preparing');
    try {
      const result = await defaultFinanceClient.fundRequest(
        {
          requestId: req.requestId,
          funder: walletState.account.address,
          amountXlm: req.requestedAmountXlm,
        },
        signTransaction,
        (s) => setTxStatus(s as ContractInvocationStatus)
      );

      if (result.successful) {
        setTxStatus('confirmed');
        setRequests((prev) =>
          prev.map((r) =>
            r.requestId === req.requestId
              ? { ...r, status: 'Funded', funder: walletState.account!.address, fundedAt: Date.now() }
              : r
          )
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setTxStatus('failed');
    }
  };

  const handleRepayRequest = async (req: FinancingRequest) => {
    if (!walletState.account) return;
    setTxStatus('preparing');
    try {
      const result = await defaultFinanceClient.recordRepayment(
        {
          requestId: req.requestId,
          farmer: walletState.account.address,
          amountXlm: req.expectedRepaymentXlm,
        },
        signTransaction,
        (s) => setTxStatus(s as ContractInvocationStatus)
      );

      if (result.successful) {
        setTxStatus('confirmed');
        setRequests((prev) =>
          prev.map((r) =>
            r.requestId === req.requestId
              ? { ...r, status: 'Repaid', repaidAt: Date.now() }
              : r
          )
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setTxStatus('failed');
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            Agricultural Financing Protocol
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Collateralized forward harvest financing backed by on-chain Farm Passports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="sm">
            Active Requests: {requests.filter((r) => r.status === 'Requested').length}
          </Badge>
          <Badge variant="neutral" size="sm">
            Total Funded: {requests.filter((r) => r.status === 'Funded' || r.status === 'Repaid').length}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Financing Creation Form */}
        <div className="lg:col-span-5">
          <Card className="p-6 bg-slate-900/90 border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Request Harvest Financing
            </h3>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Associated Farm Passport
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {passports.length > 0 ? (
                    passports.map((p) => (
                      <option key={p.farmId} value={p.farmId}>
                        {p.farmId} — {p.crop} ({p.region})
                      </option>
                    ))
                  ) : (
                    <option value="AGRI-000001">AGRI-000001 — Maize (Nakuru)</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Amount (XLM)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Duration (Days)
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                    <option value="120">120 Days</option>
                    <option value="180">180 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Financing Purpose
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Organic Seeds, Solar Irrigation, Logistics"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Repayment:</span>
                  <span className="font-semibold text-emerald-300">
                    {(parseFloat(requestedAmount || '0') * 1.065).toFixed(2)} XLM
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Repayment Premium:</span>
                  <span>6.5% APR</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg flex items-center gap-2 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {txStatus !== 'idle' && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Lifecycle State:</span>
                  <StatusPill status={txStatus} />
                </div>
              )}

              {txHash && (
                <a
                  href={getTxExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  <span>View on Stellar.Expert</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full text-xs font-semibold"
                isLoading={['preparing', 'simulating', 'awaiting_signature', 'submitting', 'pending'].includes(txStatus)}
              >
                Submit Financing Request
              </Button>
            </form>
          </Card>
        </div>

        {/* Existing Financing Requests List */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            Open & Active Financing Pools
          </h3>

          <div className="space-y-3">
            {requests.map((req) => (
              <Card
                key={req.requestId}
                className="p-5 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Request #{req.requestId}
                    </span>
                    <Badge variant="emerald" size="sm">
                      {req.farmId}
                    </Badge>
                  </div>
                  <Badge
                    variant={
                      req.status === 'Funded'
                        ? 'emerald'
                        : req.status === 'Repaid'
                        ? 'neutral'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {req.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Requested</span>
                    <span className="font-semibold text-white">
                      {req.requestedAmountXlm.toLocaleString()} XLM
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Repayment</span>
                    <span className="font-semibold text-emerald-400">
                      {req.expectedRepaymentXlm.toLocaleString()} XLM
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Duration</span>
                    <span className="text-slate-300">{req.durationDays} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Farmer</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {shortenAddress(req.farmer, 4)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/40">
                  <strong className="text-slate-300">Purpose:</strong> {req.purpose}
                </p>

                {/* Actions */}
                <div className="pt-3 flex items-center justify-end gap-2">
                  {req.status === 'Requested' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleFundRequest(req)}
                      className="text-xs"
                    >
                      Fund Request ({req.requestedAmountXlm} XLM)
                    </Button>
                  )}

                  {req.status === 'Funded' && req.farmer === walletState.account?.address && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRepayRequest(req)}
                      className="text-xs text-emerald-400 border-emerald-800"
                    >
                      Record Repayment ({req.expectedRepaymentXlm} XLM)
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
