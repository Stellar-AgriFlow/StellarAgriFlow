export interface CachedItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class OfflineStorageCache {
  private memoryFallback: Map<string, string> = new Map();

  private isBrowserStorageAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined' &&
      typeof window.localStorage.setItem === 'function'
    );
  }

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

    if (this.isBrowserStorageAvailable()) {
      try {
        window.localStorage.setItem(`agriflow_cache_${key}`, serialized);
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

    if (this.isBrowserStorageAvailable()) {
      try {
        serialized = window.localStorage.getItem(storageKey);
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
    if (this.isBrowserStorageAvailable()) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {}
    }
    this.memoryFallback.delete(storageKey);
  }

  clear(): void {
    if (this.isBrowserStorageAvailable()) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key?.startsWith('agriflow_cache_')) {
            keysToRemove.push(key);
          }
        }
        for (const k of keysToRemove) {
          window.localStorage.removeItem(k);
        }
      } catch {}
    }
    this.memoryFallback.clear();
  }
}
