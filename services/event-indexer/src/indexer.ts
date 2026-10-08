import { rpc, scValToNative } from '@stellar/stellar-sdk';
import {
  STELLAR_SOROBAN_RPC_URL,
  FARM_REGISTRY_CONTRACT_ID,
  AGRICULTURAL_FINANCE_CONTRACT_ID,
  AGRICULTURAL_ESCROW_CONTRACT_ID,
  AGRICULTURAL_MARKETPLACE_CONTRACT_ID,
  AGRICULTURAL_REPUTATION_CONTRACT_ID,
} from '@agriflow/stellar';
import { IndexedProtocolEvent, ProtocolEventType } from '@agriflow/types';
import { IndexerDatabase } from './database';

export class SorobanEventIndexer {
  private server: rpc.Server;
  private db: IndexerDatabase;
  private isRunning: boolean = false;
  private monitoredContracts: string[];

  constructor(
    db?: IndexerDatabase,
    rpcUrl: string = STELLAR_SOROBAN_RPC_URL,
    contracts?: string[]
  ) {
    this.db = db || new IndexerDatabase();
    this.server = new rpc.Server(rpcUrl, { allowHttp: false });
    this.monitoredContracts = contracts || [
      FARM_REGISTRY_CONTRACT_ID,
      AGRICULTURAL_FINANCE_CONTRACT_ID,
      AGRICULTURAL_ESCROW_CONTRACT_ID,
      AGRICULTURAL_MARKETPLACE_CONTRACT_ID,
      AGRICULTURAL_REPUTATION_CONTRACT_ID,
    ];
  }

  public getDatabase(): IndexerDatabase {
    return this.db;
  }

  public async pollEventsOnce(): Promise<number> {
    try {
      const latestLedgerResp = await this.server.getLatestLedger();
      const currentLedger = latestLedgerResp.sequence;

      let startLedger = this.db.getLastLedger();
      if (startLedger === 0) {
        // Start from recent 1000 ledgers
        startLedger = Math.max(1, currentLedger - 1000);
      }

      const response = await this.server.getEvents({
        startLedger,
        filters: [
          {
            type: 'contract',
            contractIds: this.monitoredContracts,
          },
        ],
        limit: 100,
      });

      let processed = 0;
      if (response && response.events) {
        for (const rawEvent of response.events) {
          const parsed = this.parseContractEvent(rawEvent);
          if (parsed) {
            const added = this.db.insertEvent(parsed);
            if (added) processed++;
          }
        }
      }

      this.db.setLastLedger(currentLedger);
      return processed;
    } catch {
      // In case of network fault, fail gracefully and resume on next poll
      return 0;
    }
  }

  private parseContractEvent(event: any): IndexedProtocolEvent | null {
    try {
      const contractId = event.contractId;
      const ledger = event.ledger;
      const txHash = event.txHash || `tx-${ledger}-${Math.random().toString(36).slice(2, 8)}`;
      const timestamp = Date.now();

      // Parse topics
      const rawTopics = event.topic || [];
      const topicSymbols: string[] = [];

      for (const t of rawTopics) {
        try {
          const val = scValToNative(t);
          topicSymbols.push(String(val));
        } catch {
          // ignore unparseable
        }
      }

      const primaryTopic = topicSymbols[0] || 'Unknown';
      let eventType: ProtocolEventType = 'FarmRegistered';
      let data: Record<string, any> = {};
      let farmId: string | undefined;
      let primaryWallet: string | undefined;

      // Extract raw data
      try {
        if (event.value) {
          const nativeVal = scValToNative(event.value);
          if (typeof nativeVal === 'object' && nativeVal !== null) {
            data = nativeVal;
          } else {
            data = { value: nativeVal };
          }
        }
      } catch {
        // Fallback
      }

      switch (primaryTopic) {
        case 'FarmRegistered':
          eventType = 'FarmRegistered';
          farmId = topicSymbols[1] || data.farmId;
          primaryWallet = data.owner;
          break;
        case 'FinancingRequested':
          eventType = 'FinancingRequested';
          farmId = data.farmId;
          primaryWallet = data.farmer;
          break;
        case 'FinancingFunded':
          eventType = 'FinancingFunded';
          primaryWallet = data.funder;
          break;
        case 'RepaymentRecorded':
          eventType = 'RepaymentRecorded';
          primaryWallet = data.farmer;
          break;
        case 'ListingCreated':
          eventType = 'ListingCreated';
          farmId = data.farmId;
          primaryWallet = data.seller;
          break;
        case 'ListingPurchased':
          eventType = 'ListingPurchased';
          primaryWallet = data.buyer;
          break;
        case 'EscrowCreated':
          eventType = 'EscrowCreated';
          primaryWallet = data.buyer;
          break;
        case 'EscrowFunded':
          eventType = 'EscrowFunded';
          primaryWallet = data.buyer;
          break;
        case 'EscrowReleased':
          eventType = 'EscrowReleased';
          primaryWallet = data.seller;
          break;
        case 'ReputationUpdated':
          eventType = 'ReputationUpdated';
          primaryWallet = topicSymbols[1] || data.user;
          break;
        default:
          return null;
      }

      return {
        id: event.id || `${txHash}-${ledger}-${primaryTopic}`,
        eventType,
        contractId,
        ledger,
        txHash,
        timestamp,
        data,
        primaryWallet,
        farmId,
      };
    } catch {
      return null;
    }
  }

  public start(intervalMs: number = 6000): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const loop = async () => {
      if (!this.isRunning) return;
      await this.pollEventsOnce();
      setTimeout(loop, intervalMs);
    };

    loop();
  }

  public stop(): void {
    this.isRunning = false;
  }
}
