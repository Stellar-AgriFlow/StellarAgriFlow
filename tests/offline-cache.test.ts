import { describe, it, expect, beforeEach } from 'vitest';
import { OfflineStorageCache } from '../packages/contracts-client/src/offlineCache';

describe('Offline Storage Cache Architecture', () => {
  let cache: OfflineStorageCache;

  beforeEach(() => {
    cache = new OfflineStorageCache();
    cache.clear();
  });

  it('stores and retrieves items correctly before expiration', () => {
    cache.set('farmer_profile_1', { name: 'Amara Diop', crop: 'Cassava' }, 60000);
    const result = cache.get<{ name: string; crop: string }>('farmer_profile_1');

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Amara Diop');
    expect(result?.crop).toBe('Cassava');
  });

  it('returns null and purges expired cached items', async () => {
    // Set with 1ms TTL
    cache.set('stale_metric', { val: 42 }, 1);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const result = cache.get('stale_metric');
    expect(result).toBeNull();
  });

  it('explicitly removes items by key', () => {
    cache.set('temp_key', 'hello_world', 10000);
    expect(cache.get('temp_key')).toBe('hello_world');

    cache.remove('temp_key');
    expect(cache.get('temp_key')).toBeNull();
  });
});
