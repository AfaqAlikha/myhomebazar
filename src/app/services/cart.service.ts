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
export class CartService {
  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private authService: AuthService,
  ) {}

  addToCart(productId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(API_ENDPOINTS.cart.add, { product: productId }, { headers }).pipe(
      tap((res) => {
        if (res?.message) this.toastr.success(res.message);
      }),
      catchError((error) => this.handleError(error, 'Failed to add to cart')),
    );
  }

  getCart(params?: Record<string, unknown>): Observable<any> {
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
    return this.http
      .get<any>(API_ENDPOINTS.cart.myCart, { params: queryParams, headers })
      .pipe(catchError((error) => this.handleError(error, 'Failed to fetch cart')));
  }

  removeFromCart(itemId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete<any>(API_ENDPOINTS.cart.remove(itemId), { headers }).pipe(
      tap((res) => {
        if (res?.message) this.toastr.success(res.message);
      }),
      catchError((error) => this.handleError(error, 'Failed to remove item')),
    );
  }

  updateQuantity(itemId: string, quantity: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .put<any>(API_ENDPOINTS.cart.updateQuantity(itemId), { quantity }, { headers })
      .pipe(
        tap((res) => {
          if (res?.message) this.toastr.success(res.message);
        }),
        catchError((error) => this.handleError(error, 'Failed to update quantity')),
      );
  }

  checkoutCart(buyerData: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(API_ENDPOINTS.cart.checkout, buyerData, { headers }).pipe(
      tap((res) => {
        if (res?.message && !res.url) {
          this.toastr.success(res.message);
        }
      }),
      catchError((error) => this.handleError(error, 'Checkout failed!')),
    );
  }

  getSessionMetadata(sessionId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .get<any>(API_ENDPOINTS.cart.sessionMetadata(sessionId), { headers })
      .pipe(catchError((error) => this.handleError(error, 'Failed to fetch session metadata')));
  }

  confirmPayment(sessionId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http
      .post<any>(API_ENDPOINTS.cart.confirmPayment, { sessionId }, { headers })
      .pipe(
        tap((res) => {
          if (res?.message) this.toastr.success(res.message);
        }),
        catchError((error) => this.handleError(error, 'Payment confirmation failed')),
      );
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
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
