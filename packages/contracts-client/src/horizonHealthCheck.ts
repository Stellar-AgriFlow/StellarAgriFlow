export interface RpcEndpointConfig {
  url: string;
  label: string;
  priority: number;
}

export interface NodeHealthReport {
  url: string;
  label: string;
  latencyMs: number;
  isHealthy: boolean;
  healthScore: number;
  latestLedger?: number;
}

export class HorizonHealthMonitor {
  private endpoints: RpcEndpointConfig[];
  private activeEndpointIndex: number = 0;

  constructor(endpoints: RpcEndpointConfig[] = []) {
    this.endpoints = endpoints.length > 0 ? endpoints : [
      { url: 'https://soroban-testnet.stellar.org', label: 'Stellar Foundation Testnet', priority: 1 },
      { url: 'https://rpc-testnet.stellar.org', label: 'Stellar Backup RPC', priority: 2 },
    ];
  }

  /**
   * Evaluates endpoint health and assigns rank based on latency and status
   */
  evaluateNode(
    endpoint: RpcEndpointConfig,
    simulatedLatencyMs: number,
    isHealthy: boolean = true,
    latestLedger: number = 1000000
  ): NodeHealthReport {
    const healthScore = isHealthy ? Math.max(10, 1000 - Math.min(990, simulatedLatencyMs)) : 0;
    return {
      url: endpoint.url,
      label: endpoint.label,
      latencyMs: simulatedLatencyMs,
      isHealthy,
      healthScore,
      latestLedger: isHealthy ? latestLedger : undefined,
    };
  }

  /**
   * Sorts candidate nodes by health score and elects highest-ranking node
   */
  electPrimaryNode(reports: NodeHealthReport[]): NodeHealthReport | undefined {
    const healthyNodes = reports.filter((r) => r.isHealthy);
    if (healthyNodes.length === 0) return undefined;

    // Highest health score first (lowest latency)
    healthyNodes.sort((a, b) => b.healthScore - a.healthScore);
    return healthyNodes[0];
  }

  getActiveUrl(): string {
    return this.endpoints[this.activeEndpointIndex]?.url || '';
  }

  failover(): string {
    this.activeEndpointIndex = (this.activeEndpointIndex + 1) % this.endpoints.length;
    return this.getActiveUrl();
  }
}
