interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export const CACHE_KEYS = {
  LOGO: 'mhb_cache_logo',
  BANNERS: 'mhb_cache_banners',
  THEME: 'mhb_cache_theme',
} as const;

export const CACHE_TTL = {
  LOGO_MS: 60 * 60 * 1000,
  BANNERS_MS: 15 * 60 * 1000,
  THEME_MS: 60 * 60 * 1000,
} as const;

export function readPublicCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function writePublicCache<T>(key: string, data: T, ttlMs: number): void {
  if (typeof window === 'undefined') return;

  try {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Ignore quota / private mode errors
  }
}

export function clearPublicCache(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}
