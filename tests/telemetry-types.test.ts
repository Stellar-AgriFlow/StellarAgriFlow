import { describe, it, expect } from 'vitest';
import { MetricFamily, SorobanNodeHealthTelemetry } from '../packages/types/src/telemetry';

describe('Telemetry Types', () => {
  it('instantiates valid MetricFamily and SorobanNodeHealthTelemetry structures', () => {
    const family: MetricFamily = {
      name: 'soroban_tx_latency_seconds',
      help: 'Latency of Soroban transaction submission in seconds',
      type: 'histogram',
      samples: [
        {
          name: 'soroban_tx_latency_seconds_sum',
          labels: { network: 'testnet' },
          value: 12.45,
        },
      ],
    };

    const health: SorobanNodeHealthTelemetry = {
      isSynced: true,
      latestLedger: 524100,
      ledgerCloseTimeMs: 4950,
      rpcRoundtripMs: 45,
      pendingTxCount: 3,
      storageDiskUsedBytes: 1024 * 1024 * 512,
      cpuLoadPercent: 12.5,
      memoryUsageMb: 850,
      timestamp: Date.now(),
    };

    expect(family.type).toBe('histogram');
    expect(family.samples).toHaveLength(1);
    expect(health.isSynced).toBe(true);
    expect(health.latestLedger).toBe(524100);
  });
});
