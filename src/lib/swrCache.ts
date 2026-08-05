/**
 * Tiny stale-while-revalidate cache backed by sessionStorage.
 *
 * - Fresh (< ttlMs): value is returned and no refetch is needed.
 * - Stale (< maxAgeMs): value is returned immediately and the caller revalidates.
 * - Expired / missing: caller must fetch.
 *
 * Also acts as a resilience layer: if a fetch fails, the last known payload can
 * still be shown instead of an error screen.
 */

const PREFIX = 'defit:swr:';

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

export interface CacheRead<T> {
  data: T;
  cachedAt: number;
  isStale: boolean;
  isExpired: boolean;
}

export const DEFAULT_TTL_MS = 60_000; // fresh for 1 minute
export const DEFAULT_MAX_AGE_MS = 15 * 60_000; // usable (stale) for 15 minutes

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readCache<T>(
  key: string,
  ttlMs = DEFAULT_TTL_MS,
  maxAgeMs = DEFAULT_MAX_AGE_MS,
): CacheRead<T> | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || typeof entry.cachedAt !== 'number') return null;
    const age = Date.now() - entry.cachedAt;
    return {
      data: entry.data,
      cachedAt: entry.cachedAt,
      isStale: age > ttlMs,
      isExpired: age > maxAgeMs,
    };
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(PREFIX + key, JSON.stringify({ data, cachedAt: Date.now() } satisfies CacheEntry<T>));
  } catch {
    /* quota or serialization failure — cache is best-effort */
  }
}

export function clearCache(keyPrefix?: string): void {
  const store = storage();
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(PREFIX + (keyPrefix ?? ''))) keys.push(k);
    }
    keys.forEach(k => store.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Human-readable "updated 2 min ago" style label. */
export function formatCacheAge(cachedAt: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - cachedAt) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
