'use client';

import React, { useState } from 'react';
import { ShieldCheck, Plus, Sparkles, CloudSun, AlertCircle } from 'lucide-react';
import { ParametricPolicy, LiquidityPoolStatus } from '@agriflow/types';
import { ParametricPolicyCard } from '../../components/insurance/ParametricPolicyCard';
import { UnderwritePolicyModal } from '../../components/insurance/UnderwritePolicyModal';
import { LiquidityPoolWidget } from '../../components/insurance/LiquidityPoolWidget';
import { WeatherRiskGauge } from '../../components/oracle/WeatherRiskGauge';

const MOCK_POLICIES: ParametricPolicy[] = [
  {
    id: 1,
    farmer: 'GDQW...FARMER1',
    riskType: 'Drought',
    triggerThreshold: 45,
    payoutAmountUsd: 5000,
    premiumAmountUsd: 250,
    startTime: Math.floor(Date.now() / 1000) - 86400 * 20,
    expirationTime: Math.floor(Date.now() / 1000) + 86400 * 70,
    status: 'Active',
  },
  {
    id: 2,
    farmer: 'GDQW...FARMER1',
    riskType: 'Flood',
    triggerThreshold: 150,
    payoutAmountUsd: 3000,
    premiumAmountUsd: 150,
    startTime: Math.floor(Date.now() / 1000) - 86400 * 60,
    expirationTime: Math.floor(Date.now() / 1000) - 86400 * 10,
    status: 'PaidOut',
  },
];

const INITIAL_POOL: LiquidityPoolStatus = {
  totalDeposited: 150000,
  totalReserved: 45000,
  totalShares: 150000,
  userShares: 5000,
};

export default function ParametricInsurancePage() {
  const [policies, setPolicies] = useState<ParametricPolicy[]>(MOCK_POLICIES);
  const [poolStatus, setPoolStatus] = useState<LiquidityPoolStatus>(INITIAL_POOL);
  const [isUnderwriteOpen, setIsUnderwriteOpen] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const handleUnderwrite = async (params: any) => {
    const premium = Math.round(params.payoutAmountUsd * 0.05);
    const newPolicy: ParametricPolicy = {
      id: policies.length + 1,
      farmer: 'GDQW...CURRENTUSER',
      riskType: params.riskType,
      triggerThreshold: params.triggerThreshold,
      payoutAmountUsd: params.payoutAmountUsd,
      premiumAmountUsd: premium,
      startTime: Math.floor(Date.now() / 1000),
      expirationTime: Math.floor(Date.now() / 1000) + params.durationDays * 86400,
      status: 'Active',
    };
    setPolicies([newPolicy, ...policies]);
    setPoolStatus({
      ...poolStatus,
      totalDeposited: poolStatus.totalDeposited + premium,
      totalReserved: poolStatus.totalReserved + params.payoutAmountUsd,
    });
  };

  const handleClaim = async (policyId: number) => {
    setClaimingId(policyId);
    setTimeout(() => {
      setPolicies(
        policies.map((p) => (p.id === policyId ? { ...p, status: 'PaidOut' } : p))
      );
      setClaimingId(null);
    }, 1500);
  };

  const handleDepositCapital = async (amount: number) => {
    setPoolStatus({
      ...poolStatus,
      totalDeposited: poolStatus.totalDeposited + amount,
      totalShares: poolStatus.totalShares + amount,
      userShares: (poolStatus.userShares || 0) + amount,
    });
  };

  const handleWithdrawCapital = async (shares: number) => {
    setPoolStatus({
      ...poolStatus,
      totalDeposited: Math.max(0, poolStatus.totalDeposited - shares),
      totalShares: Math.max(0, poolStatus.totalShares - shares),
      userShares: Math.max(0, (poolStatus.userShares || 0) - shares),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Parametric Climate Insurance
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Decentralized, oracle-automated drought and flood coverage powered by Soroban on Stellar
            </p>
          </div>

          <button
            onClick={() => setIsUnderwriteOpen(true)}
            className="flex items-center gap-2 py-3 px-5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-900/30 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Underwrite Policy</span>
          </button>
        </div>

        {/* Live Weather Gauges */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CloudSun className="w-4 h-4 text-amber-400" />
            <span>Active Agricultural Regional Risk Feeds</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <WeatherRiskGauge
              regionName="Sub-Saharan Maize Belt (Zone 1)"
              currentDroughtIndex={32}
              triggerThreshold={45}
              soilMoisturePercent={24}
            />
            <WeatherRiskGauge
              regionName="East Africa Highland Coffee (Zone 2)"
              currentDroughtIndex={48}
              triggerThreshold={50}
              soilMoisturePercent={16}
            />
            <WeatherRiskGauge
              regionName="West Africa Cocoa Basin (Zone 3)"
              currentDroughtIndex={15}
              triggerThreshold={40}
              soilMoisturePercent={38}
            />
          </div>
        </div>

        {/* Policies and Liquidity Pool Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Your Underwritten Policies
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((p) => (
                <ParametricPolicyCard
                  key={p.id}
                  policy={p}
                  onClaim={handleClaim}
                  isClaiming={claimingId === p.id}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Reinsurance Solvency Pool
            </h2>
            <LiquidityPoolWidget
              status={poolStatus}
              onDeposit={handleDepositCapital}
              onWithdraw={handleWithdrawCapital}
            />
          </div>
        </div>

        {/* Underwrite Modal */}
        <UnderwritePolicyModal
          isOpen={isUnderwriteOpen}
          onClose={() => setIsUnderwriteOpen(false)}
          onUnderwrite={handleUnderwrite}
        />
      </div>
    </div>
  );
}
