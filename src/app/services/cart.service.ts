import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { AuthService } from '../auth/auth.service';
import { getOrCreateVisitorId } from '../utils/visitor-id';

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
    return this.http.post<any>(API_ENDPOINTS.cart.add, { product: productId }, { headers: this.getHeaders() }).pipe(
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
    return this.http
      .get<any>(API_ENDPOINTS.cart.myCart, { params: queryParams, headers: this.getHeaders() })
      .pipe(catchError((error) => this.handleError(error, 'Failed to fetch cart')));
  }

  removeFromCart(itemId: string): Observable<any> {
    return this.http.delete<any>(API_ENDPOINTS.cart.remove(itemId), { headers: this.getHeaders() }).pipe(
      tap((res) => {
        if (res?.message) this.toastr.success(res.message);
      }),
      catchError((error) => this.handleError(error, 'Failed to remove item')),
    );
  }

  updateQuantity(itemId: string, quantity: number): Observable<any> {
    return this.http
      .put<any>(API_ENDPOINTS.cart.updateQuantity(itemId), { quantity }, { headers: this.getHeaders() })
      .pipe(
        tap((res) => {
          if (res?.message) this.toastr.success(res.message);
        }),
        catchError((error) => this.handleError(error, 'Failed to update quantity')),
      );
  }

  checkoutCart(buyerData: any): Observable<any> {
    const url = this.authService.isLoggedIn()
      ? API_ENDPOINTS.cart.checkout
      : API_ENDPOINTS.cart.guestCheckout;

    return this.http.post<any>(url, buyerData, { headers: this.getHeaders() }).pipe(
      tap((res) => {
        if (res?.message && !res.url && !res.data?.checkout) {
          this.toastr.success(res.message);
        }
      }),
      catchError((error) => this.handleError(error, 'Checkout failed!')),
    );
  }

  getSessionMetadata(sessionId: string): Observable<any> {
    return this.http
      .get<any>(API_ENDPOINTS.cart.sessionMetadata(sessionId), { headers: this.getHeaders() })
      .pipe(catchError((error) => this.handleError(error, 'Failed to fetch session metadata')));
  }

  confirmPayment(sessionId: string): Observable<any> {
    return this.http
      .post<any>(API_ENDPOINTS.cart.confirmPayment, { sessionId }, { headers: this.getHeaders() })
      .pipe(
        tap((res) => {
          if (res?.message) this.toastr.success(res.message);
        }),
        catchError((error) => this.handleError(error, 'Payment confirmation failed')),
      );
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const visitorId = getOrCreateVisitorId();
    if (visitorId) {
      headers = headers.set('X-Visitor-Id', visitorId);
    }

    const token = this.authService.getToken();
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
