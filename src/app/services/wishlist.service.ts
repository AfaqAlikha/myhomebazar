import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { env } from '../../environments/env';
import { ToastrService } from 'ngx-toastr';
@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private baseUrl = `${env.BASE_URL}/wishlistproducts`;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

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
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    });
    return this.http.get(`${this.baseUrl}`, { params: queryParams, headers });
  }

  // ✅ Add product to wishlist
  addToWishlist(productId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    });

    return this.http
      .post<any>(`${this.baseUrl}/add`, { productId }, { headers })
      .pipe(
        tap((res) => {
          if (res?.message) {
            this.toastr.success(res.message);
          }
        }),
        catchError((error) => {
          this.toastr.error(error.error?.message || 'Something went wrong!');
          return throwError(() => error);
        })
      );
  }

  // ✅ Remove product from wishlist
  removeFromWishlist(productId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    });

    return this.http
      .delete<any>(`${this.baseUrl}/remove/${productId}`, { headers })
      .pipe(
        tap((res) => {
          if (res?.message) {
            this.toastr.success(res.message);
          }
        }),
        catchError((error) => {
          this.toastr.error(error.error?.message || 'Something went wrong!');
          return throwError(() => error);
        })
      );
  }

  // ✅ Clear entire wishlist
  clearWishlist(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    });

    return this.http.delete<any>(`${this.baseUrl}/clear`, { headers }).pipe(
      tap((res) => {
        if (res?.message) {
          this.toastr.success(res.message);
        }
      }),
      catchError((error) => {
        this.toastr.error(error.error?.message || 'Something went wrong!');
        return throwError(() => error);
      })
    );
  }
}
