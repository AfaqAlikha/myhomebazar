import { jwtDecode } from 'jwt-decode';

export interface JwtUser {
  id: string;
  name: string;
  email: string;
  role: string;
  country: string;
  state: string;
  city: string;
  exp: number;
  iat: number;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getToken(): string | null {
  return getCookie('token');
}

export function getUser(): JwtUser | null {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<JwtUser>(token);
    if (decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Product list API returns user as string ID; detail API returns populated user object. */
export function getProductSellerId(product: {
  user?: string | { _id?: string; id?: string } | null;
}): string | null {
  if (!product?.user) return null;
  if (typeof product.user === 'string') return product.user;
  return product.user._id || product.user.id || null;
}

export function isOwnProduct(
  product: { user?: string | { _id?: string; id?: string } | null },
  currentUserId: string | null | undefined,
): boolean {
  if (!currentUserId) return false;
  const sellerId = getProductSellerId(product);
  return !!sellerId && sellerId === currentUserId;
}
