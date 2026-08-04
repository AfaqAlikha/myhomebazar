import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './auth.service';
import { getOrCreateVisitorId } from '../utils/visitor-id';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private auth: AuthService,
    private toastr: ToastrService,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const withCreds = req.clone({ withCredentials: true });
    const authed = this.addAuthHeader(withCreds);

    return next.handle(authed).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          if (this.isPublicAuthRequest(req.url)) {
            return throwError(() => error);
          }

          if (this.shouldRefresh(error, req)) {
            return this.handle401(authed, next);
          }

          if (this.auth.wasSessionActive() && !this.auth.isLoggingOut()) {
            this.auth.handleSessionExpired();
          } else {
            this.auth.clearStaleSession();
          }

          return throwError(() => error);
        }

        if (error.status === 401 && this.shouldSuppressError(req.url, error)) {
          return throwError(() => error);
        }

        if (error.status === 403) {
          if (!this.shouldSuppressError(req.url, error)) {
            this.toastr.error('Access denied');
          }
        } else if (error.status === 404) {
          if (!this.shouldSuppressError(req.url, error)) {
            this.toastr.error('Not found');
          }
        } else if (error.status === 500) {
          this.toastr.error('Something went wrong, please try again');
        } else if (error.status === 0) {
          this.toastr.error('Check your internet connection');
        }

        return throwError(() => error);
      }),
    );
  }

  private addAuthHeader(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const headers: Record<string, string> = {};
    const visitorId = getOrCreateVisitorId();
    if (visitorId) {
      headers['X-Visitor-Id'] = visitorId;
    }

    if (this.auth.isLoggedIn()) {
      const token = this.auth.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return Object.keys(headers).length ? req.clone({ setHeaders: headers }) : req;
  }

  private isPublicAuthRequest(url: string): boolean {
    return (
      url.includes('/login') ||
      url.includes('/signup') ||
      url.includes('/verify-email') ||
      url.includes('/refresh-token') ||
      url.includes('/logout') ||
      url.includes('/public/') ||
      url.includes('/guest-checkout') ||
      url.includes('/productOrder/track') ||
      url.includes('/productOrder/confirm-payment')
    );
  }

  private shouldSuppressError(url: string, error: HttpErrorResponse): boolean {
    if (this.auth.isLoggingOut()) return true;
    if (url.includes('/about/public')) return true;
    if (url.includes('/refresh-token') && error.status === 401) return true;
    if (url.includes('/logout')) return true;
    return false;
  }

  private shouldRefresh(error: HttpErrorResponse, req: HttpRequest<unknown>): boolean {
    if (this.auth.isLoggingOut()) return false;
    if (error.status !== 401) return false;
    if (req.headers.has('X-Retry-After-Refresh')) return false;
    if (this.isPublicAuthRequest(req.url)) return false;

    return this.auth.isLoggedIn() || this.auth.wasSessionActive();
  }

  private handle401(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.auth.refreshAccessToken().pipe(
        switchMap((token) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          return next.handle(
            this.addAuthHeader(request.clone({ setHeaders: { 'X-Retry-After-Refresh': '1' } })),
          );
        }),
        catchError((err) => {
          this.isRefreshing = false;
          if (this.auth.wasSessionActive() && !this.auth.isLoggingOut()) {
            this.auth.handleSessionExpired();
          } else {
            this.auth.clearStaleSession();
          }
          return throwError(() => err);
        }),
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap(() =>
        next.handle(this.addAuthHeader(request.clone({ setHeaders: { 'X-Retry-After-Refresh': '1' } }))),
      ),
    );
  }
}
