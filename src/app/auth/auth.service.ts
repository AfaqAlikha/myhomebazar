import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, map, throwError, BehaviorSubject, Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { JwtUser, SignupData, LoginData } from '../core/models/user.model';

export type { JwtUser, SignupData, LoginData };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenSubject: BehaviorSubject<string | null>;
  private userSubject: BehaviorSubject<JwtUser | null>;

  token$: Observable<string | null>;
  user$: Observable<JwtUser | null>;

  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    const token = this.getCookie('token');

    this.tokenSubject = new BehaviorSubject<string | null>(token);
    this.userSubject = new BehaviorSubject<JwtUser | null>(this.getUser());

    this.token$ = this.tokenSubject.asObservable();
    this.user$ = this.userSubject.asObservable();
  }

  private getCookie(name: string): string | null {
    if (!this.isBrowser) return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private setCookie(name: string, value: string, days = 7): void {
    if (!this.isBrowser) return;
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  }

  private deleteCookie(name: string): void {
    if (!this.isBrowser) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }

  getToken(): string | null {
    if (this.isBrowser) return this.getCookie('token');
    return this.tokenSubject.value;
  }

  getUser(): JwtUser | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtUser>(token);
      if (decoded.exp * 1000 < Date.now()) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  hasExpiredSession(): boolean {
    const token = this.getCookie('token');
    if (!token) return false;
    try {
      const decoded = jwtDecode<JwtUser>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  clearSession(showToast = false): void {
    if (this.isBrowser) {
      this.deleteCookie('token');
    }
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    if (showToast) {
      this.toastr.success('Logged out successfully!');
    }
  }

  handleSessionExpired(): void {
    this.clearSession(false);
    this.toastr.error('Your session has expired. Please log in again.');
    this.router.navigate(['/signin']);
  }

  private setAccessToken(token: string): void {
    if (this.isBrowser) this.setCookie('token', token);
    this.tokenSubject.next(token);
    this.userSubject.next(this.getUser());
  }

  refreshAccessToken(): Observable<string> {
    return this.http
      .post<{ data?: { token?: string; accessToken?: string }; token?: string }>(
        API_ENDPOINTS.auth.refreshToken,
        {},
        { withCredentials: true },
      )
      .pipe(
        map((res) => {
          const token = res.data?.token || res.data?.accessToken || res.token;
          if (!token) throw new Error('Missing access token');
          this.setAccessToken(token);
          return token;
        }),
      );
  }

  trySilentRefresh(): Observable<boolean> {
    if (this.isLoggedIn()) return of(true);
    return this.refreshAccessToken().pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  logout(): void {
    this.http
      .post(API_ENDPOINTS.auth.logout, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.clearSession(true));
  }

  private getAuthHeaders(): { headers?: HttpHeaders } {
    const token = this.getToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  signup(data: SignupData) {
    return this.http.post(API_ENDPOINTS.auth.signup, data).pipe(
      map((res: any) => {
        this.toastr.success(res.message);
        return res;
      }),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Signup failed');
        return throwError(() => err);
      }),
    );
  }

  login(data: LoginData) {
    return this.http.post(API_ENDPOINTS.auth.login, data, { withCredentials: true }).pipe(
      map((res: any) => {
        this.toastr.success(res.message);

        if (res.token) {
          if (this.isBrowser) this.setCookie('token', res.token);
          this.tokenSubject.next(res.token);
          this.userSubject.next(this.getUser());
        }

        return res;
      }),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Login failed');
        return throwError(() => err);
      }),
    );
  }

  verifyEmail(token: string) {
    return this.http.get(API_ENDPOINTS.auth.verifyEmail, { params: { token } }).pipe(
      map((res: any) => {
        this.toastr.success(res.message || 'Email verified successfully!');
        return res;
      }),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Email verification failed');
        return throwError(() => err);
      }),
    );
  }

  getMyProfile() {
    return this.http.get(API_ENDPOINTS.auth.profile, this.getAuthHeaders()).pipe(
      map((res: any) => res.data?.user ?? res.user),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Failed to fetch profile');
        return throwError(() => err);
      }),
    );
  }

  getUserProfile(userId: string) {
    return this.http.get(API_ENDPOINTS.auth.profileById(userId), this.getAuthHeaders()).pipe(
      map((res: any) => res.user),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Failed to fetch user profile');
        return throwError(() => err);
      }),
    );
  }

  getPublicProfile(userId: string): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.auth.publicProfile(userId)).pipe(
      map((res) => res.data?.user ?? res.user),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Failed to fetch public profile');
        return throwError(() => err);
      }),
    );
  }

  updateProfile(userId: string, data: { name?: string; bio?: string }) {
    return this.http
      .patch(API_ENDPOINTS.auth.updateProfile(userId), data, this.getAuthHeaders())
      .pipe(
        map((res: any) => {
          this.toastr.success(res.message || 'Profile updated successfully!');
          const currentUser = this.userSubject.value;
          if (currentUser && currentUser.id === userId) {
            const updatedUser = { ...currentUser, ...data };
            this.userSubject.next(updatedUser as JwtUser);
          }
          return res.data?.user ?? res.user;
        }),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Failed to update profile');
          return throwError(() => err);
        }),
      );
  }

  sendPasswordOtp(email?: string) {
    const body = email ? { email } : {};
    return this.http.post(API_ENDPOINTS.auth.sendPasswordOtp, body, this.getAuthHeaders()).pipe(
      map((res: any) => {
        this.toastr.success(res.message || 'OTP sent to your email');
        return res;
      }),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Failed to send OTP');
        return throwError(() => err);
      }),
    );
  }

  changePasswordWithOtp(payload: {
    otp: string;
    newPassword: string;
    confirmPassword: string;
    email?: string;
  }) {
    return this.http.post(API_ENDPOINTS.auth.changePasswordWithOtp, payload, this.getAuthHeaders()).pipe(
      map((res: any) => {
        this.toastr.success(res.message || 'Password changed successfully');
        return res;
      }),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Failed to change password');
        return throwError(() => err);
      }),
    );
  }
}
