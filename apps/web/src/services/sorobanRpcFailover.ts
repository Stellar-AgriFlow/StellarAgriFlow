export interface RpcEndpointConfig {
  url: string;
  name: string;
  weight?: number;
}

export interface NodeHealthStatus {
  url: string;
  name: string;
  isAlive: boolean;
  latencyMs: number;
  lastChecked: number;
}

export class SorobanRpcFailoverManager {
  private endpoints: RpcEndpointConfig[];
  private activeEndpointIndex: number = 0;
  private healthCache: Map<string, NodeHealthStatus> = new Map();

  constructor(
    endpoints: RpcEndpointConfig[] = [
      { url: 'https://soroban-testnet.stellar.org', name: 'SDF Official Testnet' },
      { url: 'https://testnet.stellar.rpc.thirdweb.com', name: 'Thirdweb Testnet RPC' },
      { url: 'https://stellar-testnet.blockpi.network/v1/rpc/public', name: 'BlockPI Testnet RPC' },
    ]
  ) {
    if (endpoints.length === 0) {
      throw new Error('At least one Soroban RPC endpoint must be configured');
    }
    this.endpoints = endpoints;
  }

  /**
   * Get the currently active healthy RPC endpoint URL
   */
  getActiveEndpoint(): string {
    return this.endpoints[this.activeEndpointIndex].url;
  }

  /**
   * Ping an RPC endpoint with getHealth or getNetwork to measure latency
   */
  async checkEndpointHealth(url: string): Promise<NodeHealthStatus> {
    const start = Date.now();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
        }),
      });

      const latencyMs = Date.now() - start;
      const isAlive = response.ok;
      const endpoint = this.endpoints.find((e) => e.url === url);

      const status: NodeHealthStatus = {
        url,
        name: endpoint?.name || url,
        isAlive,
        latencyMs,
        lastChecked: Date.now(),
      };

      this.healthCache.set(url, status);
      return status;
    } catch {
      const endpoint = this.endpoints.find((e) => e.url === url);
      const status: NodeHealthStatus = {
        url,
        name: endpoint?.name || url,
        isAlive: false,
        latencyMs: -1,
        lastChecked: Date.now(),
      };
      this.healthCache.set(url, status);
      return status;
    }
  }

  /**
   * Rotates to next available RPC endpoint upon consecutive failure
   */
  rotateEndpoint(): string {
    this.activeEndpointIndex = (this.activeEndpointIndex + 1) % this.endpoints.length;
    return this.getActiveEndpoint();
  }

  /**
   * Performs an RPC call with automatic failover across configured endpoints
   */
  async executeWithFailover<T>(
    operation: (endpointUrl: string) => Promise<T>,
    maxAttempts: number = this.endpoints.length
  ): Promise<T> {
    let lastError: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentUrl = this.getActiveEndpoint();
      try {
        return await operation(currentUrl);
      } catch (err) {
        lastError = err;
        console.warn(`RPC call to ${currentUrl} failed, failing over to next endpoint`, err);
        this.rotateEndpoint();
      }
    }

    throw new Error(
      `All Soroban RPC failover endpoints exhausted. Last error: ${lastError?.message || lastError}`
    );
  }

  getAllEndpointStatuses(): NodeHealthStatus[] {
    return Array.from(this.healthCache.values());
  }
}
