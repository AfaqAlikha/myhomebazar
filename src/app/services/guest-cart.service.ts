const GUEST_CART_KEY = 'mhb_guest_cart';

export interface GuestCartProduct {
  _id: string;
  name: string;
  images?: string[];
  price: number;
  weightKg?: number;
  user?: string | { _id?: string };
}

export interface GuestCartItem {
  id: string;
  productId: string;
  quantity: number;
  product: GuestCartProduct;
}

const createItemId = (): string =>
  `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const readGuestCart = (): GuestCartItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeGuestCart = (items: GuestCartItem[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export const clearGuestCart = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
};

export const addProductToGuestCart = (product: GuestCartProduct, quantity = 1): GuestCartItem[] => {
  const items = readGuestCart();
  const existing = items.find((item) => item.productId === product._id);

  if (existing) {
    existing.quantity += quantity;
    writeGuestCart(items);
    return items;
  }

  const next = [
    ...items,
    {
      id: createItemId(),
      productId: product._id,
      quantity,
      product,
    },
  ];

  writeGuestCart(next);
  return next;
};

export const updateGuestCartQuantity = (itemId: string, quantity: number): GuestCartItem[] => {
  const items = readGuestCart().map((item) =>
    item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item,
  );
  writeGuestCart(items);
  return items;
};

export const removeGuestCartItem = (itemId: string): GuestCartItem[] => {
  const items = readGuestCart().filter((item) => item.id !== itemId);
  writeGuestCart(items);
  return items;
};

export const getGuestCartCount = (): number =>
  readGuestCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
