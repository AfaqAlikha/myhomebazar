import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { catchError, map, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProductOrderService {
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

  getOrderByProduct(productId: string) {
    return this.http
      .get(API_ENDPOINTS.productOrder.byProduct(productId), { headers: this.getHeaders() })
      .pipe(
        map((res: any) => res),
        catchError((err) => throwError(() => err)),
      );
  }

  getMyOrders(page = 1, limit = 10) {
    return this.http.get(`${API_ENDPOINTS.productOrder.orders}?page=${page}&limit=${limit}`, {
      headers: this.getHeaders(),
    });
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
}
