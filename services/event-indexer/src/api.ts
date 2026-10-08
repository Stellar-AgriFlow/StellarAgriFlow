import { EventFilterCriteria, IndexedProtocolEvent } from '@agriflow/types';
import { IndexerDatabase } from './database';
import { SorobanEventIndexer } from './indexer';

export class IndexerApiClient {
  private indexer: SorobanEventIndexer;

  constructor(indexer?: SorobanEventIndexer) {
    this.indexer = indexer || new SorobanEventIndexer();
  }

  public async getEvents(criteria?: EventFilterCriteria): Promise<IndexedProtocolEvent[]> {
    // Poll new events before query
    await this.indexer.pollEventsOnce();
    return this.indexer.getDatabase().queryEvents(criteria);
  }

  public async getEventsForWallet(wallet: string, limit: number = 20): Promise<IndexedProtocolEvent[]> {
    return this.getEvents({ wallet, limit });
  }

  public async getEventsForFarm(farmId: string, limit: number = 20): Promise<IndexedProtocolEvent[]> {
    return this.getEvents({ farmId, limit });
  }
}

export const defaultIndexerApiClient = new IndexerApiClient();
