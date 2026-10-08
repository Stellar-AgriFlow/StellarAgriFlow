import os from 'os';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { IndexerDatabase } from '../services/event-indexer/src/database';
import { IndexedProtocolEvent } from '../packages/types/src/indexer';

describe('Event Indexer Database & Query Engine', () => {
  it('inserts events and prevents duplicate processing', () => {
    const testPath = path.join(os.tmpdir(), `test-indexer-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    const db = new IndexerDatabase(testPath);

    const event1: IndexedProtocolEvent = {
      id: 'event-001',
      eventType: 'FarmRegistered',
      ledger: 1000,
      txHash: '016b501af3eb125c4f713e657046606334c3cc441c9acac555d986a3e2433a8e',
      timestamp: Date.now(),
      data: { farmId: 'AGRI-000001', owner: 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU' },
      primaryWallet: 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
      farmId: 'AGRI-000001',
    };

    const insertedFirst = db.insertEvent(event1);
    expect(insertedFirst).toBe(true);

    // Duplicate attempt
    const insertedSecond = db.insertEvent(event1);
    expect(insertedSecond).toBe(false);
  });

  it('filters indexed events by wallet, farmId, and eventType', () => {
    const testPath = path.join(os.tmpdir(), `test-indexer-filter-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    const db = new IndexerDatabase(testPath);

    const event1: IndexedProtocolEvent = {
      id: 'event-trade-01',
      eventType: 'EscrowReleased',
      ledger: 1002,
      txHash: 'tx-hash-trade-01',
      timestamp: Date.now(),
      data: { amount: 1500 },
      primaryWallet: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    };

    const event2: IndexedProtocolEvent = {
      id: 'event-farm-02',
      eventType: 'FarmRegistered',
      ledger: 1005,
      txHash: 'tx-hash-farm-02',
      timestamp: Date.now(),
      data: { farmId: 'AGRI-000009' },
      farmId: 'AGRI-000009',
    };

    db.insertEvent(event1);
    db.insertEvent(event2);

    const farmEvents = db.queryEvents({ farmId: 'AGRI-000009' });
    expect(farmEvents.length).toBeGreaterThanOrEqual(1);
    expect(farmEvents[0].farmId).toBe('AGRI-000009');

    const walletEvents = db.queryEvents({
      wallet: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    });
    expect(walletEvents.length).toBeGreaterThanOrEqual(1);
    expect(walletEvents[0].eventType).toBe('EscrowReleased');
  });
});
