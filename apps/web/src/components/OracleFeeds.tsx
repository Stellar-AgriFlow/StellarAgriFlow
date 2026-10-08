'use client';

import React, { useState, useEffect } from 'react';
import { defaultOracleService } from '@agriflow/oracle';
import { OracleFeedData } from '@agriflow/types';
import { Card, Badge } from '@agriflow/ui';
import {
  TrendingUp,
  TrendingDown,
  CloudRain,
  Thermometer,
  ShieldAlert,
  Globe2,
  ExternalLink,
  Activity,
} from 'lucide-react';

export function OracleFeeds() {
  const [oracleData, setOracleData] = useState<OracleFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    defaultOracleService.getOracleData().then((data) => {
      setOracleData(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-emerald-400" />
            Agricultural Oracle Data Feeds
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time reference commodity benchmarks and weather risk feeds for forward agricultural contracts.
          </p>
        </div>

        <Badge variant="warning" size="sm">
          External Market Feed (Off-Chain Reference)
        </Badge>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">
          Loading live commodity and weather oracle feeds...
        </div>
      ) : oracleData ? (
        <div className="space-y-6">
          {/* Commodity Price Cards */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Global Commodity Benchmarks (USD / XLM)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {oracleData.prices.map((p) => (
                <Card
                  key={p.commodity}
                  className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{p.commodity}</span>
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-0.5 ${
                        p.change24hPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {p.change24hPercent >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {p.change24hPercent > 0 ? '+' : ''}
                      {p.change24hPercent}%
                    </span>
                  </div>

                  <div className="text-base font-bold text-emerald-300">
                    ${p.priceUsdPerTon.toLocaleString()}{' '}
                    <span className="text-[10px] text-slate-500 font-normal">/ ton</span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-0.5">
                    ≈ {p.priceXlmPerTon.toLocaleString()} XLM
                  </div>

                  <span className="text-[9px] text-slate-500 block truncate mt-2">
                    {p.source}
                  </span>
                </Card>
              ))}
            </div>
          </div>

          {/* Regional Weather Index */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              Regional Weather & Drought Risk Indicators
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oracleData.weather.map((w) => (
                <Card
                  key={w.region}
                  className="p-4 bg-slate-900/80 border-slate-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {w.region}
                      </span>
                      <span className="text-[10px] text-slate-400">{w.country}</span>
                    </div>

                    <Badge
                      variant={
                        w.droughtRisk === 'Low'
                          ? 'emerald'
                          : w.droughtRisk === 'Moderate'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {w.droughtRisk} Drought Risk
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 text-xs my-2">
                    <div className="flex items-center gap-2">
                      <CloudRain className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="text-[10px] text-slate-500 block">Rainfall</span>
                        <span className="font-semibold text-slate-200">
                          {w.rainfallMm} mm
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-[10px] text-slate-500 block">Temp</span>
                        <span className="font-semibold text-slate-200">
                          {w.temperatureCelsius}°C
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1 text-slate-400">
                    <span>Harvest Outlook:</span>
                    <span className="text-emerald-300 font-medium">
                      {w.harvestOutlook}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
