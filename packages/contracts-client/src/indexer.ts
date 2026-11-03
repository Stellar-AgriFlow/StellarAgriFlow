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
}
