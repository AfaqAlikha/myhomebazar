import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private authService: AuthService,
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  getWishlist(params?: Record<string, unknown>): Observable<any> {
    let queryParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const val = params[key];
        if (val !== undefined && val !== null) {
          queryParams = queryParams.set(key, String(val));
        }
      });
    }
    const headers = this.getHeaders();
    return this.http.get(API_ENDPOINTS.wishlist.list, { params: queryParams, headers });
  }

  addToWishlist(productId: string): Observable<any> {
    const headers = this.getHeaders();

    return this.http.post<any>(API_ENDPOINTS.wishlist.add, { productId }, { headers }).pipe(
      tap((res) => {
        if (res?.message) {
          this.toastr.success(res.message);
        }
      }),
      catchError((error) => {
        this.toastr.error(error.error?.message || 'Something went wrong!');
        return throwError(() => error);
      }),
    );
  }

  removeFromWishlist(productId: string): Observable<any> {
    const headers = this.getHeaders();

    return this.http.delete<any>(API_ENDPOINTS.wishlist.remove(productId), { headers }).pipe(
      tap((res) => {
        if (res?.message) {
          this.toastr.success(res.message);
        }
      }),
      catchError((error) => {
        this.toastr.error(error.error?.message || 'Something went wrong!');
        return throwError(() => error);
      }),
    );
  }

  clearWishlist(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete<any>(API_ENDPOINTS.wishlist.clear, { headers }).pipe(
      tap((res) => {
        if (res?.message) {
          this.toastr.success(res.message);
        }
      }),
      catchError((error) => {
        this.toastr.error(error.error?.message || 'Something went wrong!');
        return throwError(() => error);
      }),
    );
  }
}
