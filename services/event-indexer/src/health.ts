import http from 'http';
import { SorobanEventIndexer } from './indexer';

export interface IndexerHealthPayload {
  status: 'ok' | 'unhealthy';
  lastLedger: number;
  totalEventsIndexed: number;
  uptimeSeconds: number;
  error?: string;
}

export interface IndexerHealthCheckOptions {
  /** Optional custom RPC reachability probe for deterministic testing */
  checkRpcReachable?: () => Promise<boolean>;
  /** Process or service start timestamp in milliseconds */
  startedAtMs?: number;
}

const DEFAULT_START_TIME_MS = Date.now();

/**
 * Evaluates indexer health and Soroban RPC connectivity, returning the HTTP status
 * code (`200` when healthy, `503` when Soroban RPC is unreachable) and JSON payload.
 */
export async function evaluateIndexerHealth(
  indexer: SorobanEventIndexer,
  options: IndexerHealthCheckOptions = {}
): Promise<{ statusCode: 200 | 503; payload: IndexerHealthPayload }> {
  const db = indexer.getDatabase();
  const lastLedger = db.getLastLedger();
  const totalEventsIndexed = db.getEventCount();
  const startedAt = options.startedAtMs ?? DEFAULT_START_TIME_MS;
  const uptimeSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

  let isReachable = true;
  let rpcError: string | undefined;

  try {
    if (options.checkRpcReachable) {
      isReachable = await options.checkRpcReachable();
    } else {
      const internalServer = (indexer as unknown as {
        server?: { getLatestLedger?: () => Promise<{ sequence: number }> };
      }).server;
      if (internalServer && typeof internalServer.getLatestLedger === 'function') {
        const latest = await internalServer.getLatestLedger();
        isReachable = Boolean(latest && typeof latest.sequence === 'number');
      }
    }
  } catch (err) {
    isReachable = false;
    rpcError = err instanceof Error ? err.message : 'Soroban RPC endpoint is unreachable';
  }

  if (!isReachable) {
    return {
      statusCode: 503,
      payload: {
        status: 'unhealthy',
        lastLedger,
        totalEventsIndexed,
        uptimeSeconds,
        error: rpcError || 'Soroban RPC endpoint is unreachable',
      },
    };
  }

  return {
    statusCode: 200,
    payload: {
      status: 'ok',
      lastLedger,
      totalEventsIndexed,
      uptimeSeconds,
    },
  };
}

/**
 * Creates a lightweight HTTP server exposing `GET /health` for the event indexer service.
 */
export function createIndexerHealthServer(
  indexer: SorobanEventIndexer,
  options: IndexerHealthCheckOptions = {}
): http.Server {
  const startedAtMs = options.startedAtMs ?? Date.now();

  return http.createServer(async (req, res) => {
    const urlPath = (req.url || '/').split('?')[0];

    if (req.method === 'GET' && urlPath === '/health') {
      const { statusCode, payload } = await evaluateIndexerHealth(indexer, {
        ...options,
        startedAtMs,
      });
      res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(payload));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });
}
