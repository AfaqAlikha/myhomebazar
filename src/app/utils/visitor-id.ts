const VISITOR_ID_KEY = 'mhb_visitor_id';
const VIEWED_PRODUCTS_KEY = 'mhb_viewed_products';

const createVisitorId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

export const getOrCreateVisitorId = (): string => {
  if (typeof window === 'undefined') return '';

  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const visitorId = createVisitorId();
  localStorage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId;
};

export const hasLocalProductView = (productId: string): boolean => {
  if (typeof window === 'undefined' || !productId) return false;

  try {
    const viewed = JSON.parse(localStorage.getItem(VIEWED_PRODUCTS_KEY) || '[]') as string[];
    return viewed.includes(productId);
  } catch {
    return false;
  }
};

export const markLocalProductView = (productId: string): void => {
  if (typeof window === 'undefined' || !productId) return;

  try {
    const viewed = new Set<string>(
      JSON.parse(localStorage.getItem(VIEWED_PRODUCTS_KEY) || '[]') as string[],
    );
    viewed.add(productId);
    localStorage.setItem(VIEWED_PRODUCTS_KEY, JSON.stringify([...viewed]));
  } catch {
    localStorage.setItem(VIEWED_PRODUCTS_KEY, JSON.stringify([productId]));
  }
};

export const getEngagementHeaders = (authToken?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-Visitor-Id': getOrCreateVisitorId(),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
};
