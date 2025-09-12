const memoryCache = new Map<string, any>();

export function setCache(key: string, value: any) {
  try {
    memoryCache.set(key, value);
  } catch {
    // ignore
  }
}

export function getCache<T = any>(key: string): T | undefined {
  return memoryCache.get(key) as T | undefined;
}

export function hasCache(key: string): boolean {
  return memoryCache.has(key);
}

export function clearCache(key?: string) {
  if (key) memoryCache.delete(key);
  else memoryCache.clear();
}
