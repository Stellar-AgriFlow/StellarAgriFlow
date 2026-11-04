import { describe, it, expect } from 'vitest';
import { TelemetryCollector } from '../packages/contracts-client/src/telemetryExporter';

describe('TelemetryCollector', () => {
  it('records counters, gauges, histograms and generates valid Prometheus text exposition', () => {
    const collector = new TelemetryCollector();

    // 1. Counter: transactions submitted
    collector.incrementCounter(
      'stellar_transactions_total',
      5,
      { network: 'testnet', status: 'success' },
      'Total Stellar transactions submitted'
    );
    collector.incrementCounter(
      'stellar_transactions_total',
      1,
      { network: 'testnet', status: 'failed' },
      'Total Stellar transactions submitted'
    );

    // 2. Gauge: active RPC latency
    collector.setGauge(
      'stellar_rpc_latency_ms',
      142,
      { endpoint: 'https://soroban-testnet.stellar.org' },
      'Current Soroban RPC roundtrip latency'
    );

    // 3. Histogram: invocation CPU instructions
    collector.observeHistogram(
      'soroban_cpu_instructions',
      250000,
      { contract: 'CooperativeVault' },
      [100000, 500000, 1000000],
      'Soroban CPU instructions per invocation'
    );

    const output = collector.exportPrometheusFormat();

    expect(output).toContain('# HELP stellar_transactions_total');
    expect(output).toContain('# TYPE stellar_transactions_total counter');
    expect(output).toContain('stellar_transactions_total{network="testnet",status="success"} 5');
    expect(output).toContain('stellar_transactions_total{network="testnet",status="failed"} 1');
    expect(output).toContain('stellar_rpc_latency_ms{endpoint="https://soroban-testnet.stellar.org"} 142');
    expect(output).toContain('soroban_cpu_instructions_count{contract="CooperativeVault"} 1');
    expect(output).toContain('soroban_cpu_instructions_sum{contract="CooperativeVault"} 250000');
  });

  it('rejects negative counter delta', () => {
    const collector = new TelemetryCollector();
    expect(() => collector.incrementCounter('tx_count', -1)).toThrow(/non-negative/);
  });
});
