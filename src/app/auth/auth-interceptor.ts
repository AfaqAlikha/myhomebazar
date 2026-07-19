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

          if (this.auth.wasSessionActive()) {
            this.auth.handleSessionExpired();
          } else {
            this.auth.clearStaleSession();
          }

          return throwError(() => error);
        }

        if (error.status === 403) {
          this.toastr.error('Access denied');
        } else if (error.status === 404) {
          this.toastr.error('Not found');
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
    if (!this.auth.isLoggedIn()) return req;

    const token = this.auth.getToken();
    if (!token) return req;

    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private isPublicAuthRequest(url: string): boolean {
    return (
      url.includes('/login') ||
      url.includes('/signup') ||
      url.includes('/verify-email') ||
      url.includes('/refresh-token') ||
      url.includes('/public/')
    );
  }

  private shouldRefresh(error: HttpErrorResponse, req: HttpRequest<unknown>): boolean {
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
          if (this.auth.wasSessionActive()) {
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
