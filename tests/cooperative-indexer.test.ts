import { describe, it, expect } from 'vitest';
import { EventStreamIndexer } from '../packages/contracts-client/src/indexer';
import { ParsedSorobanEvent } from '../packages/contracts-client/src/events';

describe('Cooperative EventStreamIndexer', () => {
  const contractId = 'CACOOPVAULTA4GRICULTURESTREASURYSTK6QUORUMVOTING88888888';

  function createMockRawEvent(
    id: string,
    topic: string,
    subTopic: string,
    data: any
  ) {
    // Instead of raw XDR, we can directly create an ingested parsed event or mock
    return {
      contractId,
      topic: [topic, subTopic],
      value: typeof data === 'string' ? data : JSON.stringify(data),
      ledger: 1000,
      ledgerClosedAt: new Date().toISOString(),
      id,
    };
  }

  it('aggregates registered cooperative members across distinct events', () => {
    const indexer = new EventStreamIndexer();

    // Ingest events
    const ev1: ParsedSorobanEvent = {
      contractId,
      topic: 'coop',
      subTopic: 'mbr_add',
      data: 'GDFARMER1111111111111111111111111111111111111111111111111111',
      ledger: 1001,
      ledgerClosedAt: '2026-11-04T00:00:00Z',
      id: 'evt-1',
    };
    const ev2: ParsedSorobanEvent = {
      contractId,
      topic: 'coop',
      subTopic: 'mbr_add',
      data: 'GDFARMER2222222222222222222222222222222222222222222222222222',
      ledger: 1002,
      ledgerClosedAt: '2026-11-04T00:00:05Z',
      id: 'evt-2',
    };

    (indexer as any).eventCache.set('evt-1', ev1);
    (indexer as any).eventCache.set('evt-2', ev2);

    const members = indexer.getCooperativeMembers();
    expect(members.length).toBe(2);
    expect(members).toContain(ev1.data);
    expect(members).toContain(ev2.data);
  });

  it('computes net cooperative treasury inflow and outflow accurately', () => {
    const indexer = new EventStreamIndexer();

    (indexer as any).eventCache.set('evt-dep-1', {
      contractId,
      topic: 'coop',
      subTopic: 'deposit',
      data: ['GDFARMER1', 15000],
      ledger: 1003,
      ledgerClosedAt: '2026-11-04T00:00:10Z',
      id: 'evt-dep-1',
    });

    (indexer as any).eventCache.set('evt-dep-2', {
      contractId,
      topic: 'coop',
      subTopic: 'deposit',
      data: ['GDFARMER2', 10000],
      ledger: 1004,
      ledgerClosedAt: '2026-11-04T00:00:15Z',
      id: 'evt-dep-2',
    });

    (indexer as any).eventCache.set('evt-wd-1', {
      contractId,
      topic: 'coop',
      subTopic: 'withdraw',
      data: ['GDFARMER1', 3000],
      ledger: 1005,
      ledgerClosedAt: '2026-11-04T00:00:20Z',
      id: 'evt-wd-1',
    });

    const treasury = indexer.getCooperativeTreasuryEstimate();
    expect(treasury.totalDeposits).toBe(25000);
    expect(treasury.totalWithdrawals).toBe(3000);
    expect(treasury.netTreasury).toBe(22000);
  });

  it('filters cooperative events by subTopic', () => {
    const indexer = new EventStreamIndexer();

    (indexer as any).eventCache.set('evt-prop', {
      contractId,
      topic: 'coop',
      subTopic: 'prop_new',
      data: 1,
      ledger: 1006,
      ledgerClosedAt: '2026-11-04T00:00:25Z',
      id: 'evt-prop',
    });

    (indexer as any).eventCache.set('evt-voted', {
      contractId,
      topic: 'coop',
      subTopic: 'voted',
      data: [1, 60],
      ledger: 1007,
      ledgerClosedAt: '2026-11-04T00:00:30Z',
      id: 'evt-voted',
    });

    const proposalEvents = indexer.getCooperativeEvents('prop_new');
    expect(proposalEvents.length).toBe(1);
    expect(proposalEvents[0].id).toBe('evt-prop');

    const voteEvents = indexer.getCooperativeEvents('voted');
    expect(voteEvents.length).toBe(1);
    expect(voteEvents[0].id).toBe('evt-voted');
  });
});
