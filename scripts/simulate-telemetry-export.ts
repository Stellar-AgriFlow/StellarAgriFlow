import { TelemetryCollector } from '../packages/contracts-client/src/telemetryExporter';

export interface TelemetrySimulationReport {
  totalTransactionsSimulated: number;
  totalFeesStroops: number;
  avgLatencyMs: number;
  prometheusExpositionText: string;
}

export function simulateTelemetryLifecycle(): TelemetrySimulationReport {
  const collector = new TelemetryCollector();
  const transactionsCount = 25;
  let totalFees = 0;
  let totalLatency = 0;

  for (let i = 0; i < transactionsCount; i++) {
    const isSuccess = i % 10 !== 0; // 90% success rate
    const latency = 80 + Math.floor(Math.sin(i) * 30 + (i % 5) * 15);
    const feeStroops = 2500 + (i % 7) * 200;

    totalLatency += latency;
    totalFees += feeStroops;

    collector.incrementCounter(
      'stellar_tx_count_total',
      1,
      {
        status: isSuccess ? 'success' : 'failed',
        contract: i % 2 === 0 ? 'CooperativeVault' : 'ParametricInsurance',
      },
      'Total submitted Soroban transactions'
    );

    collector.incrementCounter(
      'stellar_tx_fee_stroops_total',
      feeStroops,
      { network: 'soroban-testnet' },
      'Total transaction fees paid in stroops'
    );

    collector.observeHistogram(
      'soroban_tx_latency_ms',
      latency,
      { network: 'soroban-testnet' },
      [50, 100, 150, 200, 300],
      'Transaction confirmation latency'
    );
  }

  collector.setGauge(
    'soroban_channel_pool_healthy_count',
    8,
    { status: 'idle' },
    'Number of idle available channel accounts'
  );

  const text = collector.exportPrometheusFormat();

  return {
    totalTransactionsSimulated: transactionsCount,
    totalFeesStroops: totalFees,
    avgLatencyMs: Math.round(totalLatency / transactionsCount),
    prometheusExpositionText: text,
  };
}

if (process.env.RUN_STANDALONE === 'true') {
  const res = simulateTelemetryLifecycle();
  console.log('--- Prometheus Telemetry Simulation Report ---');
  console.log(`Transactions: ${res.totalTransactionsSimulated}, Avg Latency: ${res.avgLatencyMs}ms`);
  console.log('\n--- Prometheus Exposition Sample ---\n');
  console.log(res.prometheusExpositionText);
}
