// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { env } from '../../environments/env';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private baseUrl = `${env.BASE_URL}/cart`;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  // ✅ Add product to cart
  addToCart(productId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .post<any>(`${this.baseUrl}/add`, { product: productId }, { headers })
      .pipe(
        tap((res) => {
          if (res?.message) this.toastr.success(res.message);
        }),
        catchError((error) => this.handleError(error, 'Failed to add to cart'))
      );
  }

  // ✅ Get user cart
  getCart(params?: any): Observable<any> {
    let queryParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams = queryParams.set(key, params[key]);
        }
      });
    }
    const headers = this.getHeaders();
    return this.http
      .get<any>(`${this.baseUrl}/my-cart`, { params: queryParams, headers })
      .pipe(
        catchError((error) => this.handleError(error, 'Failed to fetch cart'))
      );
  }

  // ✅ Remove item
  removeFromCart(itemId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .delete<any>(`${this.baseUrl}/remove/${itemId}`, { headers })
      .pipe(
        tap((res) => {
          if (res?.message) this.toastr.success(res.message);
        }),
        catchError((error) => this.handleError(error, 'Failed to remove item'))
      );
  }

  // ✅ Update quantity
  updateQuantity(itemId: string, quantity: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .put<any>(
        `${this.baseUrl}/update-quantity/${itemId}`,
        { quantity },
        { headers }
      )
      .pipe(
        tap((res) => {
          if (res?.message) this.toastr.success(res.message);
        }),
        catchError((error) =>
          this.handleError(error, 'Failed to update quantity')
        )
      );
  }

  // ✅ Checkout (COD or Online)
  checkoutCart(buyerData: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .post<any>(`${this.baseUrl}/checkout`, buyerData, { headers })
      .pipe(
        // ⚡ Ab sirf response return hoga, redirect component me handle hoga
        tap((res) => {
          if (res?.message && !res.url) {
            this.toastr.success(res.message);
          }
        }),
        catchError((error) => this.handleError(error, 'Checkout failed!'))
      );
  }

  // ✅ Stripe Session Metadata
  getSessionMetadata(sessionId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .get<any>(`${this.baseUrl}/session-metadata/${sessionId}`, { headers })
      .pipe(
        catchError((error) =>
          this.handleError(error, 'Failed to fetch session metadata')
        )
      );
  }

  // ✅ Confirm Payment (Stripe Webhook Alternative)
  confirmPayment(sessionId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .post<any>(`${this.baseUrl}/confirm-payment`, { sessionId }, { headers })
      .pipe(
        tap((res) => {
          if (res?.message) this.toastr.success(res.message);
        }),
        catchError((error) =>
          this.handleError(error, 'Payment confirmation failed')
        )
      );
  }

  // ✅ Private Helpers
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    });
  }

  private handleError(error: any, defaultMsg: string) {
    let errorMsg = defaultMsg;
    if (error.error?.error) {
      errorMsg = error.error.error;
    } else if (error.error?.message) {
      errorMsg = error.error.message;
    }
    this.toastr.error(errorMsg);
    return throwError(() => error);
  }
}
