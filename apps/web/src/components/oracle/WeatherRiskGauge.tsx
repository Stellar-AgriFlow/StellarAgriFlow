'use client';

import React from 'react';
import { Sun, AlertTriangle, ShieldCheck } from 'lucide-react';

interface WeatherRiskGaugeProps {
  regionName: string;
  currentDroughtIndex: number; // 0 to 100
  triggerThreshold: number; // e.g. 50
  soilMoisturePercent: number; // e.g. 18%
}

export const WeatherRiskGauge: React.FC<WeatherRiskGaugeProps> = ({
  regionName,
  currentDroughtIndex,
  triggerThreshold,
  soilMoisturePercent,
}) => {
  const isTriggered = currentDroughtIndex >= triggerThreshold;
  const isNearRisk = !isTriggered && currentDroughtIndex >= triggerThreshold * 0.8;

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-400" />
          <h4 className="font-semibold text-sm text-white">{regionName}</h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            isTriggered
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : isNearRisk
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {isTriggered ? 'Trigger Active' : isNearRisk ? 'Elevated Risk' : 'Normal Conditions'}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Drought Stress Index</span>
          <span className="font-bold text-white">
            {currentDroughtIndex} / 100 (Trigger at {triggerThreshold})
          </span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isTriggered ? 'bg-red-500' : isNearRisk ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, currentDroughtIndex)}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-1 bg-white opacity-60 shadow-sm"
            style={{ left: `${Math.min(100, triggerThreshold)}%` }}
            title={`Trigger Threshold: ${triggerThreshold}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/40 border border-slate-800 rounded-xl text-xs">
        <div>
          <span className="text-slate-400 block mb-0.5">Soil Moisture:</span>
          <span className="text-sm font-semibold text-white">{soilMoisturePercent}%</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Insurance Payout:</span>
          <span className="text-sm font-semibold text-white">
            {isTriggered ? (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Eligible
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Covered
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
