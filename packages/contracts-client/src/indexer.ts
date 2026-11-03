import { ParsedSorobanEvent, SorobanEventParser } from './events';

export type EventListenerCallback = (event: ParsedSorobanEvent) => void;

export class EventStreamIndexer {
  private eventCache: Map<string, ParsedSorobanEvent> = new Map();
  private listeners: Set<EventListenerCallback> = new Set();
  private maxCacheSize: number;

  constructor(maxCacheSize: number = 200) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Ingests a raw event, deduplicating by ID and notifying listeners
   */
  ingestRawEvent(rawEvent: {
    contractId: string;
    topic: string[];
    value: string;
    ledger: number;
    ledgerClosedAt: string;
    id: string;
  }): boolean {
    if (this.eventCache.has(rawEvent.id)) {
      return false; // Already indexed
    }

    const parsed = SorobanEventParser.parseEvent(rawEvent);
    this.eventCache.set(rawEvent.id, parsed);

    // Enforce max cache size FIFO
    if (this.eventCache.size > this.maxCacheSize) {
      const oldestKey = this.eventCache.keys().next().value;
      if (oldestKey) {
        this.eventCache.delete(oldestKey);
      }
    }

    // Broadcast to subscribers
    for (const listener of this.listeners) {
      try {
        listener(parsed);
      } catch (err) {
        console.error('Error in event subscriber callback', err);
      }
    }

    return true;
  }

  subscribe(callback: EventListenerCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  getRecentEvents(topicFilter?: string): ParsedSorobanEvent[] {
    const events = Array.from(this.eventCache.values());
    if (topicFilter) {
      return events.filter((e) => e.topic === topicFilter);
    }
    return events;
  }

  getCacheSize(): number {
    return this.eventCache.size;
  }

  /**
   * Retrieves cooperative-specific events
   */
  getCooperativeEvents(subTopicFilter?: string): ParsedSorobanEvent[] {
    const coopEvents = this.getRecentEvents('coop');
    if (subTopicFilter) {
      return coopEvents.filter((e) => e.subTopic === subTopicFilter);
    }
    return coopEvents;
  }

  /**
   * Reconstructs registered cooperative members list from indexed events
   */
  getCooperativeMembers(): string[] {
    const memberEvents = this.getCooperativeEvents('mbr_add');
    const members = new Set<string>();
    for (const ev of memberEvents) {
      const parsed = SorobanEventParser.parseCooperativeEvent(ev);
      if (parsed.payload?.member) {
        members.add(parsed.payload.member);
      }
    }
    return Array.from(members);
  }

  /**
   * Reconstructs aggregate treasury deposits, withdrawals, and balance
   */
  getCooperativeTreasuryEstimate(): {
    totalDeposits: number;
    totalWithdrawals: number;
    netTreasury: number;
  } {
    let totalDeposits = 0;
    let totalWithdrawals = 0;

    for (const ev of this.getRecentEvents('coop')) {
      const parsed = SorobanEventParser.parseCooperativeEvent(ev);
      if (parsed.type === 'deposit' && parsed.payload?.amount) {
        totalDeposits += Number(parsed.payload.amount);
      } else if (parsed.type === 'withdraw' && parsed.payload?.amount) {
        totalWithdrawals += Number(parsed.payload.amount);
      }
    }

    return {
      totalDeposits,
      totalWithdrawals,
      netTreasury: Math.max(0, totalDeposits - totalWithdrawals),
    };
  }
}
