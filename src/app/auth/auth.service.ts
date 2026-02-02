import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { env } from '../../environments/env';
import { catchError, map, throwError, BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = env.BASE_URL;

  private tokenSubject: BehaviorSubject<string | null>;
  private userSubject: BehaviorSubject<any>;

  token$: Observable<string | null>;
  user$: Observable<any>;

  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    const token = this.getCookie('token');
    const user = this.getCookie('user');

    this.tokenSubject = new BehaviorSubject<string | null>(token);
    this.userSubject = new BehaviorSubject<any>(user ? JSON.parse(user) : null);

    this.token$ = this.tokenSubject.asObservable();
    this.user$ = this.userSubject.asObservable();
  }

  // ----------------------
  // Cookie helpers
  // ----------------------
  private getCookie(name: string): string | null {
    if (!this.isBrowser) return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private setCookie(name: string, value: string, days = 7) {
    if (!this.isBrowser) return;
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  }

  private deleteCookie(name: string) {
    if (!this.isBrowser) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }

  // ----------------------
  // Auth helpers
  // ----------------------
  getToken(): string | null {
    if (this.isBrowser) return this.getCookie('token');
    return this.tokenSubject.value;
  }

  getUser(): any {
    if (this.isBrowser) {
      const user = this.getCookie('user');
      return user ? JSON.parse(user) : null;
    }
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    if (this.isBrowser) {
      this.deleteCookie('token');
      this.deleteCookie('user');
    }
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this.toastr.success('Logged out successfully!');
  }

  private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = this.getToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  // ----------------------
  // API Calls
  // ----------------------
  signup(data: SignupData) {
    return this.http.post(`${this.baseUrl}/user/signup`, data).pipe(
      map((res: any) => {
        this.toastr.success(res.message);
        return res;
      }),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Signup failed');
        return throwError(() => err);
      })
    );
  }

  login(data: LoginData) {
    return this.http.post(`${this.baseUrl}/user/login`, data).pipe(
      map((res: any) => {
        this.toastr.success(res.message);

        if (res.token) {
          if (this.isBrowser) this.setCookie('token', res.token);
          this.tokenSubject.next(res.token);
        }

        if (res.user) {
          if (this.isBrowser) this.setCookie('user', JSON.stringify(res.user));
          this.userSubject.next(res.user);
        }

        return res;
      }),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Login failed');
        return throwError(() => err);
      })
    );
  }

  verifyEmail(token: string) {
    return this.http
      .get(`${this.baseUrl}/user/verify-email`, { params: { token } })
      .pipe(
        map((res: any) => {
          this.toastr.success(res.message || 'Email verified successfully!');
          return res;
        }),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Email verification failed');
          return throwError(() => err);
        })
      );
  }

  // ----------------------
  // Profile APIs
  // ----------------------
  getMyProfile() {
    return this.http
      .get(`${this.baseUrl}/user/profile`, this.getAuthHeaders())
      .pipe(
        map((res: any) => res.user),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Failed to fetch profile');
          return throwError(() => err);
        })
      );
  }

  getUserProfile(userId: string) {
    return this.http
      .get(`${this.baseUrl}/user/profile/${userId}`, this.getAuthHeaders())
      .pipe(
        map((res: any) => res.user),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Failed to fetch user profile');
          return throwError(() => err);
        })
      );
  }

  getPublicProfile(userId: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/user/public-profile/${userId}`)
      .pipe(
        map((res) => res.user),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Failed to fetch public profile');
          return throwError(() => err);
        })
      );
  }

  updateProfile(userId: string, data: { name?: string; bio?: string }) {
    return this.http
      .patch(`${this.baseUrl}/user/update-profile/${userId}`, data, this.getAuthHeaders())
      .pipe(
        map((res: any) => {
          this.toastr.success(res.message || 'Profile updated successfully!');
          const currentUser = this.userSubject.value;
          if (currentUser && currentUser._id === userId) {
            const updatedUser = { ...currentUser, ...data };
            if (this.isBrowser) this.setCookie('user', JSON.stringify(updatedUser));
            this.userSubject.next(updatedUser);
          }
          return res.user;
        }),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Failed to update profile');
          return throwError(() => err);
        })
      );
  }
}
