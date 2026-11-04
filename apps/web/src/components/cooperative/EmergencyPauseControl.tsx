'use client';

import React, { useState } from 'react';
import { ShieldAlert, PauseCircle, PlayCircle, Clock, AlertTriangle } from 'lucide-react';
import { ContractModule } from '../../../../../packages/contracts-client/src/emergencyPauseManager';

export interface ModulePauseItem {
  module: ContractModule;
  label: string;
  isPaused: boolean;
  pausedBy?: string;
  timelockRemainingSeconds?: number;
}

export interface EmergencyPauseControlProps {
  isGuardian: boolean;
  modules: ModulePauseItem[];
  onTogglePause?: (module: ContractModule, pause: boolean) => Promise<void>;
}

export const EmergencyPauseControl: React.FC<EmergencyPauseControlProps> = ({
  isGuardian,
  modules,
  onTogglePause,
}) => {
  const [loadingModule, setLoadingModule] = useState<ContractModule | null>(null);

  const handleToggle = async (module: ContractModule, currentlyPaused: boolean) => {
    if (!onTogglePause || !isGuardian) return;
    try {
      setLoadingModule(module);
      await onTogglePause(module, !currentlyPaused);
    } catch (err) {
      console.error('Failed to toggle pause', err);
    } finally {
      setLoadingModule(null);
    }
  };

  const hasAnyPaused = modules.some((m) => m.isPaused);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className={`w-5 h-5 ${hasAnyPaused ? 'text-rose-400' : 'text-emerald-400'}`} />
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              Circuit Breaker & Emergency Module Pause
            </h4>
            <span className="text-xs text-slate-400">
              Multi-Sig Guardian Operational Controls
            </span>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-full border ${
            hasAnyPaused
              ? 'bg-rose-950/60 text-rose-300 border-rose-500/50'
              : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
          }`}
        >
          {hasAnyPaused ? 'CIRCUIT BREAKER ENGAGED' : 'ALL MODULES ACTIVE'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {modules.map((item) => (
          <div
            key={item.module}
            className={`p-3.5 rounded-xl border transition-all ${
              item.isPaused
                ? 'bg-rose-950/20 border-rose-500/40'
                : 'bg-slate-800/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">{item.label}</span>
              {item.isPaused ? (
                <span className="flex items-center gap-1 text-xs text-rose-400 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Paused
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                  <PlayCircle className="w-3.5 h-3.5" />
                  Active
                </span>
              )}
            </div>

            {item.timelockRemainingSeconds !== undefined && item.timelockRemainingSeconds > 0 && (
              <div className="text-xs text-amber-300 font-mono mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Timelock: {Math.ceil(item.timelockRemainingSeconds / 60)}m
              </div>
            )}

            {isGuardian && (
              <button
                onClick={() => handleToggle(item.module, item.isPaused)}
                disabled={loadingModule === item.module}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  item.isPaused
                    ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600/80 hover:bg-rose-500 text-white'
                } disabled:opacity-50`}
              >
                {loadingModule === item.module ? (
                  'Updating...'
                ) : item.isPaused ? (
                  <>
                    <PlayCircle className="w-3.5 h-3.5" />
                    Unpause Module
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-3.5 h-3.5" />
                    Emergency Pause
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
