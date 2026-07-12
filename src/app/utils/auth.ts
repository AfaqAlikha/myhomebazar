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

export function getUser(): JwtUser | null {
  if (typeof window === 'undefined') return null; // SSR Safe

  const token = localStorage.getItem('token');

  if (!token) return null;

  try {
    const decoded = jwtDecode<JwtUser>(token);

    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }

    return decoded;
  } catch (err) {
    localStorage.removeItem('token');
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('token');

  if (!token) return null;

  try {
    const decoded = jwtDecode<JwtUser>(token);

    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }

    return token;
  } catch {
    localStorage.removeItem('token');
    return null;
  }
}
