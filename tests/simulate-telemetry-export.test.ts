import { describe, it, expect } from 'vitest';
import { simulateTelemetryLifecycle } from '../scripts/simulate-telemetry-export';

describe('simulateTelemetryLifecycle', () => {
  it('generates complete Prometheus telemetry dataset', () => {
    const report = simulateTelemetryLifecycle();

    expect(report.totalTransactionsSimulated).toBe(25);
    expect(report.totalFeesStroops).toBeGreaterThan(50000);
    expect(report.avgLatencyMs).toBeGreaterThan(50);
    expect(report.prometheusExpositionText).toContain('stellar_tx_count_total');
    expect(report.prometheusExpositionText).toContain('soroban_tx_latency_ms_bucket');
    expect(report.prometheusExpositionText).toContain('soroban_channel_pool_healthy_count');
  });
});
