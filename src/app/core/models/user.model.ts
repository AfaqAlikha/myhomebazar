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

export interface SignupData {
  name: string;
  email: string;
  password: string;
  terms: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface PublicProfile {
  _id: string;
  name: string;
  email?: string;
  bio?: string;
}
