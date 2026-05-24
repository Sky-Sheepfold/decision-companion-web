export interface CacheStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface CacheEntry<T> {
  token: string | null;
  savedAt: number;
  value: T;
}

export function readSessionCache<T>(
  key: string,
  token: string | null,
  ttlMs: number,
  now = Date.now(),
  storage = getSessionStorage()
): T | null {
  if (!storage) return null;

  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.token !== token || now - entry.savedAt > ttlMs) {
      return null;
    }
    return entry.value;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function writeSessionCache<T>(
  key: string,
  token: string | null,
  value: T,
  now = Date.now(),
  storage = getSessionStorage()
) {
  if (!storage) return;

  const entry: CacheEntry<T> = {
    token,
    savedAt: now,
    value,
  };
  storage.setItem(key, JSON.stringify(entry));
}

export function removeSessionCache(key: string, storage = getSessionStorage()) {
  storage?.removeItem(key);
}

function getSessionStorage(): CacheStorage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}
