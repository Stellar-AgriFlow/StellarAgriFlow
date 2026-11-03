export interface CachedItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class OfflineStorageCache {
  private memoryFallback: Map<string, string> = new Map();

  /**
   * Stores an item with a time-to-live (TTL) in milliseconds
   */
  set<T>(key: string, value: T, ttlMs: number = 3600000): void {
    const item: CachedItem<T> = {
      data: value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    const serialized = JSON.stringify(item);

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`agriflow_cache_${key}`, serialized);
        return;
      } catch (err) {
        console.warn('LocalStorage write failed, using memory fallback', err);
      }
    }

    this.memoryFallback.set(`agriflow_cache_${key}`, serialized);
  }

  /**
   * Retrieves an item if present and not expired
   */
  get<T>(key: string): T | null {
    const storageKey = `agriflow_cache_${key}`;
    let serialized: string | null = null;

    if (typeof localStorage !== 'undefined') {
      try {
        serialized = localStorage.getItem(storageKey);
      } catch {
        serialized = null;
      }
    }

    if (!serialized) {
      serialized = this.memoryFallback.get(storageKey) || null;
    }

    if (!serialized) return null;

    try {
      const item: CachedItem<T> = JSON.parse(serialized);
      if (Date.now() > item.expiresAt) {
        this.remove(key);
        return null;
      }
      return item.data;
    } catch {
      return null;
    }
  }

  remove(key: string): void {
    const storageKey = `agriflow_cache_${key}`;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
    this.memoryFallback.delete(storageKey);
  }

  clear(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('agriflow_cache_')) {
            keysToRemove.push(key);
          }
        }
        for (const k of keysToRemove) {
          localStorage.removeItem(k);
        }
      } catch {}
    }
    this.memoryFallback.clear();
  }
}
