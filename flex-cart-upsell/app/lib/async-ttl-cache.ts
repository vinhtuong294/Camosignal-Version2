/** Process-local cache: coalesces concurrent reads, but never caches failures.
 * Invalidating a key also detaches its in-flight read so an older result cannot
 * repopulate the cache after a product sync. No credentials belong in here.
 */
export function createAsyncTtlCache<T>(
  ttlMs: number,
  maxEntries = 32,
  now: () => number = Date.now,
) {
  const entries = new Map<
    string,
    { expiresAt: number; pending: boolean; promise: Promise<T> }
  >();

  return {
    get(key: string, load: () => Promise<T>): Promise<T> {
      const cached = entries.get(key);
      if (cached && (cached.pending || cached.expiresAt > now())) {
        return cached.promise;
      }
      entries.delete(key);
      // Bound memory even if requests arrive for many different shops.
      while (entries.size >= maxEntries) {
        entries.delete(entries.keys().next().value!);
      }
      const entry = {
        expiresAt: 0,
        pending: true,
        promise: Promise.resolve().then(load),
      };
      entry.promise = entry.promise.then(
        (value) => {
          entry.pending = false;
          entry.expiresAt = now() + ttlMs;
          return value;
        },
        (error: unknown) => {
          if (entries.get(key) === entry) entries.delete(key);
          throw error;
        },
      );
      entries.set(key, entry);
      return entry.promise;
    },
    delete(key: string) {
      entries.delete(key);
    },
  };
}
