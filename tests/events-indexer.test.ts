import { describe, it, expect, vi } from 'vitest';
import {
  SorobanEventParser,
  EventStreamIndexer,
} from '../packages/contracts-client/src';

describe('Soroban Contract Events and Stream Indexer', () => {
  const dummyContractId = 'CBABCDE1234567890123456789012345678901234567890123456789';

  it('correctly parses raw Soroban RPC event and extracts symbol topics', () => {
    const rawEvent = {
      contractId: dummyContractId,
      topic: ['AAAADgAAAA1sb2FuX2FwcHJvdmVkAAAA'], // Base64 XDR for symbol "loan_approved"
      value: 'AAAAAQ==',
      ledger: 104200,
      ledgerClosedAt: '2026-11-03T21:00:00Z',
      id: 'evt-001',
    };

    const parsed = SorobanEventParser.parseEvent(rawEvent);
    expect(parsed.contractId).toBe(dummyContractId);
    expect(parsed.ledger).toBe(104200);
    expect(parsed.id).toBe('evt-001');
    expect(parsed.topic).toBe('loan_approved');
  });

  it('falls back to raw topic string if decoding non-ScVal symbol fails', () => {
    const rawEvent = {
      contractId: dummyContractId,
      topic: ['raw_string_topic'],
      value: 'raw_value',
      ledger: 104201,
      ledgerClosedAt: '2026-11-03T21:05:00Z',
      id: 'evt-002',
    };

    const parsed = SorobanEventParser.parseEvent(rawEvent);
    expect(parsed.topic).toBe('raw_string_topic');
    expect(parsed.data).toBe('raw_value');
  });

  it('indexes events and notifies registered subscriber callbacks', () => {
    const indexer = new EventStreamIndexer(50);
    const subscriber = vi.fn();

    const unsubscribe = indexer.subscribe(subscriber);

    const inserted = indexer.ingestRawEvent({
      contractId: dummyContractId,
      topic: ['deposit_success'],
      value: '1000',
      ledger: 104205,
      ledgerClosedAt: '2026-11-03T21:10:00Z',
      id: 'evt-100',
    });

    expect(inserted).toBe(true);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'evt-100',
        topic: 'deposit_success',
      })
    );

    unsubscribe();

    indexer.ingestRawEvent({
      contractId: dummyContractId,
      topic: ['withdraw_success'],
      value: '500',
      ledger: 104206,
      ledgerClosedAt: '2026-11-03T21:12:00Z',
      id: 'evt-101',
    });

    // Subscriber should not be called after unsubscribing
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('deduplicates events by ID and ignores duplicate ingestions', () => {
    const indexer = new EventStreamIndexer(50);

    const event = {
      contractId: dummyContractId,
      topic: ['policy_underwritten'],
      value: '50',
      ledger: 104210,
      ledgerClosedAt: '2026-11-03T21:15:00Z',
      id: 'evt-dup',
    };

    expect(indexer.ingestRawEvent(event)).toBe(true);
    expect(indexer.ingestRawEvent(event)).toBe(false);
    expect(indexer.getCacheSize()).toBe(1);
  });

  it('enforces FIFO eviction when max cache size is exceeded', () => {
    const indexer = new EventStreamIndexer(3);

    for (let i = 1; i <= 4; i++) {
      indexer.ingestRawEvent({
        contractId: dummyContractId,
        topic: [`event_${i}`],
        value: `${i}`,
        ledger: 1000 + i,
        ledgerClosedAt: '2026-11-03T21:20:00Z',
        id: `evt-${i}`,
      });
    }

    expect(indexer.getCacheSize()).toBe(3);
    const cachedEvents = indexer.getRecentEvents();
    const ids = cachedEvents.map((e) => e.id);

    // Oldest event 'evt-1' should be pruned, remaining evt-2, evt-3, evt-4
    expect(ids).not.toContain('evt-1');
    expect(ids).toEqual(['evt-2', 'evt-3', 'evt-4']);
  });
});
