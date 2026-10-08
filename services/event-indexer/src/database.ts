import fs from 'fs';
import path from 'path';
import { IndexedProtocolEvent, EventFilterCriteria } from '@agriflow/types';

export interface IndexerDbState {
  lastLedger: number;
  events: IndexedProtocolEvent[];
  updatedAt: number;
}

export class IndexerDatabase {
  private dbFilePath: string;
  private state: IndexerDbState;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbFilePath = customPath;
    } else {
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch {
          // Fallback if unable to create
        }
      }
      this.dbFilePath = path.join(dataDir, 'indexer.json');
    }

    this.state = this.loadState();
  }

  private loadState(): IndexerDbState {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // Return fresh state on error
    }
    return {
      lastLedger: 0,
      events: [],
      updatedAt: Date.now(),
    };
  }

  public saveState(): void {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.state.updatedAt = Date.now();
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch {
      // Handle write errors gracefully in read-only environments
    }
  }

  public getLastLedger(): number {
    return this.state.lastLedger;
  }

  public setLastLedger(ledger: number): void {
    this.state.lastLedger = ledger;
    this.saveState();
  }

  public insertEvent(event: IndexedProtocolEvent): boolean {
    // Avoid duplicate event processing
    const exists = this.state.events.some(
      (e) => e.id === event.id || (e.txHash === event.txHash && e.eventType === event.eventType)
    );
    if (exists) {
      return false;
    }

    this.state.events.unshift(event);
    // Keep reasonable history size
    if (this.state.events.length > 1000) {
      this.state.events = this.state.events.slice(0, 1000);
    }
    this.saveState();
    return true;
  }

  public insertEvents(events: IndexedProtocolEvent[]): number {
    let inserted = 0;
    for (const event of events) {
      if (this.insertEvent(event)) {
        inserted++;
      }
    }
    return inserted;
  }

  public queryEvents(criteria?: EventFilterCriteria): IndexedProtocolEvent[] {
    let result = [...this.state.events];

    if (!criteria) {
      return result;
    }

    if (criteria.eventType) {
      result = result.filter((e) => e.eventType === criteria.eventType);
    }
    if (criteria.wallet) {
      const w = criteria.wallet.toLowerCase();
      result = result.filter(
        (e) =>
          e.primaryWallet?.toLowerCase() === w ||
          JSON.stringify(e.data).toLowerCase().includes(w)
      );
    }
    if (criteria.farmId) {
      result = result.filter(
        (e) =>
          e.farmId === criteria.farmId ||
          JSON.stringify(e.data).includes(criteria.farmId!)
      );
    }
    if (criteria.contractId) {
      result = result.filter((e) => e.contractId === criteria.contractId);
    }

    if (criteria.limit && criteria.limit > 0) {
      result = result.slice(0, criteria.limit);
    }

    return result;
  }

  public getEventCount(): number {
    return this.state.events.length;
  }
}
