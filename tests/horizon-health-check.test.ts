import { describe, it, expect } from 'vitest';
import {
  HorizonHealthMonitor,
  RpcEndpointConfig,
  NodeHealthReport,
} from '../packages/contracts-client/src/horizonHealthCheck';

describe('HorizonHealthMonitor Multi-RPC Ranking', () => {
  const endpoints: RpcEndpointConfig[] = [
    { url: 'https://rpc-primary.stellar.org', label: 'Primary RPC', priority: 1 },
    { url: 'https://rpc-backup.stellar.org', label: 'Backup RPC', priority: 2 },
  ];

  it('evaluates healthy node with accurate latency and health score', () => {
    const monitor = new HorizonHealthMonitor(endpoints);
    const report = monitor.evaluateNode(endpoints[0], 120, true, 1005000);

    expect(report.isHealthy).toBe(true);
    expect(report.latencyMs).toBe(120);
    expect(report.healthScore).toBe(880); // 1000 - 120
    expect(report.latestLedger).toBe(1005000);
  });

  it('assigns 0 health score to unhealthy node and ignores it in primary election', () => {
    const monitor = new HorizonHealthMonitor(endpoints);
    const deadReport = monitor.evaluateNode(endpoints[0], 5000, false);
    const backupReport = monitor.evaluateNode(endpoints[1], 250, true);

    expect(deadReport.healthScore).toBe(0);

    const primary = monitor.electPrimaryNode([deadReport, backupReport]);
    expect(primary?.url).toBe(endpoints[1].url);
  });

  it('elects fastest healthy node when multiple nodes are available', () => {
    const monitor = new HorizonHealthMonitor(endpoints);
    const slowReport: NodeHealthReport = monitor.evaluateNode(endpoints[0], 400, true);
    const fastReport: NodeHealthReport = monitor.evaluateNode(endpoints[1], 80, true);

    const elected = monitor.electPrimaryNode([slowReport, fastReport]);
    expect(elected?.url).toBe(endpoints[1].url);
  });

  it('advances active URL upon failover call', () => {
    const monitor = new HorizonHealthMonitor(endpoints);
    expect(monitor.getActiveUrl()).toBe(endpoints[0].url);

    const nextUrl = monitor.failover();
    expect(nextUrl).toBe(endpoints[1].url);
    expect(monitor.getActiveUrl()).toBe(endpoints[1].url);
  });
});
