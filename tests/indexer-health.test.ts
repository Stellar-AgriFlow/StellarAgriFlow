import { describe, it, expect } from 'vitest';
import path from 'path';
import os from 'os';
import {
  createIndexerHealthServer,
  evaluateIndexerHealth,
  IndexerDatabase,
  SorobanEventIndexer,
} from '../services/event-indexer/src';

describe('Event Indexer Health Check REST Endpoint', () => {
  const createTempIndexer = () => {
    const tmpFile = path.join(
      os.tmpdir(),
      `agriflow-indexer-health-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
    );
    const db = new IndexerDatabase(tmpFile);
    db.setLastLedger(542_100);
    db.insertEvent({
      id: 'evt-health-1',
      eventType: 'FarmRegistered',
      contractId: 'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ',
      ledger: 542_100,
      txHash: 'tx-health-1',
      timestamp: Date.now(),
      data: { farmId: 'FARM-101' },
      farmId: 'FARM-101',
    });
    return new SorobanEventIndexer(db);
  };

  it('returns 200 OK with status, lastLedger, totalEventsIndexed, and uptimeSeconds when RPC is healthy', async () => {
    const indexer = createTempIndexer();
    const startedAtMs = Date.now() - 12_500;

    const result = await evaluateIndexerHealth(indexer, {
      startedAtMs,
      checkRpcReachable: async () => true,
    });

    expect(result.statusCode).toBe(200);
    expect(result.payload.status).toBe('ok');
    expect(result.payload.lastLedger).toBe(542_100);
    expect(result.payload.totalEventsIndexed).toBe(1);
    expect(result.payload.uptimeSeconds).toBeGreaterThanOrEqual(12);
  });

  it('returns 503 Service Unavailable when Soroban RPC endpoint is unreachable', async () => {
    const indexer = createTempIndexer();

    const result = await evaluateIndexerHealth(indexer, {
      checkRpcReachable: async () => {
        throw new Error('connect ECONNREFUSED soroban-testnet.stellar.org:443');
      },
    });

    expect(result.statusCode).toBe(503);
    expect(result.payload.status).toBe('unhealthy');
    expect(result.payload.lastLedger).toBe(542_100);
    expect(result.payload.totalEventsIndexed).toBe(1);
    expect(result.payload.error).toContain('ECONNREFUSED');
  });

  it('serves GET /health over HTTP with JSON status payload', async () => {
    const indexer = createTempIndexer();
    let rpcHealthy = true;

    const server = createIndexerHealthServer(indexer, {
      startedAtMs: Date.now() - 5_000,
      checkRpcReachable: async () => rpcHealthy,
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      const okResp = await fetch(`http://127.0.0.1:${port}/health`);
      expect(okResp.status).toBe(200);
      const okBody = (await okResp.json()) as {
        status: string;
        lastLedger: number;
        totalEventsIndexed: number;
        uptimeSeconds: number;
      };
      expect(okBody.status).toBe('ok');
      expect(okBody.lastLedger).toBe(542_100);
      expect(okBody.totalEventsIndexed).toBe(1);
      expect(okBody.uptimeSeconds).toBeGreaterThanOrEqual(5);

      rpcHealthy = false;
      const failResp = await fetch(`http://127.0.0.1:${port}/health`);
      expect(failResp.status).toBe(503);
      const failBody = (await failResp.json()) as { status: string };
      expect(failBody.status).toBe('unhealthy');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
