import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { env } from '../../environments/env';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../auth/auth.service';
@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private baseUrl = `${env.BASE_URL}/wishlistproducts`;

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

  // ✅ Get all wishlist items of logged-in user
  getWishlist(params?: any): Observable<any> {
    let queryParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams = queryParams.set(key, params[key]);
        }
      });
    }
    const headers = this.getHeaders();
    return this.http.get(`${this.baseUrl}`, { params: queryParams, headers });
  }

  // ✅ Add product to wishlist
  addToWishlist(productId: string): Observable<any> {
    const headers = this.getHeaders();

    return this.http.post<any>(`${this.baseUrl}/add`, { productId }, { headers }).pipe(
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

  // ✅ Remove product from wishlist
  removeFromWishlist(productId: string): Observable<any> {
    const headers = this.getHeaders();

    return this.http.delete<any>(`${this.baseUrl}/remove/${productId}`, { headers }).pipe(
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

  // ✅ Clear entire wishlist
  clearWishlist(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete<any>(`${this.baseUrl}/clear`, { headers }).pipe(
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
