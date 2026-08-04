import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { catchError, map, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { AuthService } from '../auth/auth.service';
import { getOrCreateVisitorId } from '../utils/visitor-id';

@Injectable({
  providedIn: 'root',
})
export class ProductOrderService {
  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private authService: AuthService,
  ) {}

  confirmPayment(sessionId: string) {
    return this.http
      .post(API_ENDPOINTS.productOrder.confirmPayment, { sessionId }, { headers: this.getHeaders() })
      .pipe(
        map((res: any) => {
          this.toastr.success(res.message || 'Payment confirmed successfully!');
          return res;
        }),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Payment confirmation failed');
          return throwError(() => err);
        }),
      );
  }

  createOrder(orderData: any) {
    return this.http
      .post(API_ENDPOINTS.productOrder.create, orderData, { headers: this.getHeaders() })
      .pipe(
        map((res: any) => {
          this.toastr.success(res.message || 'Order placed successfully!');
          return res;
        }),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Failed to place order');
          return throwError(() => err);
        }),
      );
  }

  trackGuestOrder(orderId: string, phone: string) {
    return this.http.post(
      API_ENDPOINTS.productOrder.trackGuest,
      { orderId, phone },
      { headers: this.getHeaders() },
    );
  }

  getOrderByProduct(productId: string) {
    return this.http
      .get(API_ENDPOINTS.productOrder.byProduct(productId), { headers: this.getHeaders() })
      .pipe(
        map((res: any) => res),
        catchError((err) => throwError(() => err)),
      );
  }

  getMyOrders(page = 1, limit = 10) {
    return this.http.get(
      `${API_ENDPOINTS.productOrder.orders}?page=${page}&limit=${limit}&scope=buyer`,
      {
        headers: this.getHeaders(),
      },
    );
  }

  updateOrderStatus(
    orderId: string,
    data: { status: string; rating?: number; comment?: string; cancelReason?: string },
  ) {
    return this.http
      .put(API_ENDPOINTS.productOrder.update(orderId), data, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((res: any) => {
          this.toastr.success(res.message || 'Order updated successfully!');
          return res;
        }),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Failed to update order');
          return throwError(() => err);
        }),
      );
  }

  submitReview(orderId: string, data: { rating: number; comment?: string }) {
    return this.http
      .post(API_ENDPOINTS.productOrder.review(orderId), data, { headers: this.getHeaders() })
      .pipe(
        map((res: any) => {
          this.toastr.success(res.message || 'Review submitted successfully!');
          return res;
        }),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Failed to submit review');
          return throwError(() => err);
        }),
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
}
