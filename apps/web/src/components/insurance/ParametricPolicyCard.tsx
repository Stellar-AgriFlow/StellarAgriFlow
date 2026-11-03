'use client';

import React from 'react';
import { Shield, CloudRain, Sun, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { ParametricPolicy } from '@agriflow/types';

interface ParametricPolicyCardProps {
  policy: ParametricPolicy;
  onClaim?: (policyId: number) => void;
  isClaiming?: boolean;
}

export const ParametricPolicyCard: React.FC<ParametricPolicyCardProps> = ({
  policy,
  onClaim,
  isClaiming = false,
}) => {
  const isDrought = policy.riskType === 'Drought';
  const isPaidOut = policy.status === 'PaidOut';
  const isActive = policy.status === 'Active';
  const isExpired = policy.status === 'Expired';

  const expirationDate = new Date(policy.expirationTime * 1000).toLocaleDateString();

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-200">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isDrought
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
              }`}
            >
              {isDrought ? <Sun className="w-5 h-5" /> : <CloudRain className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Policy #{policy.id}</h4>
              <p className="text-xs text-slate-400">{policy.riskType} Protection</p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              isPaidOut
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isActive
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {policy.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Coverage Payout:</span>
            <span className="text-sm font-bold text-white">${policy.payoutAmountUsd.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Premium Paid:</span>
            <span className="text-sm font-semibold text-slate-300">${policy.premiumAmountUsd.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Trigger Threshold:</span>
            <span className="text-slate-200 font-medium">
              {isDrought ? `Drought Index > ${policy.triggerThreshold}` : `Rainfall > ${policy.triggerThreshold} mm`}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Expires:</span>
            <span className="text-slate-200 font-medium">{expirationDate}</span>
          </div>
        </div>
      </div>

      <div>
        {isActive && onClaim && (
          <button
            onClick={() => onClaim(policy.id)}
            disabled={isClaiming}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isClaiming ? 'Evaluating Oracle...' : 'Evaluate Trigger Payout'}</span>
          </button>
        )}

        {isPaidOut && (
          <div className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Claim Settled Directly to Wallet</span>
          </div>
        )}
      </div>
    </div>
  );
};
