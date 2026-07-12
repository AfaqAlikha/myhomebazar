import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { env } from '../../environments/env';
import { catchError, map, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
@Injectable({
  providedIn: 'root',
})
export class ProductOrderService {
  private baseUrl = `${env.BASE_URL}/productOrder`;

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

  // ✅ Confirm payment
  confirmPayment(sessionId: string) {
    return this.http
      .post(`${this.baseUrl}/confirm-payment`, { sessionId }, { headers: this.getHeaders() })
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

  // ✅ Create order
  createOrder(orderData: any) {
    return this.http.post(`${this.baseUrl}`, orderData, { headers: this.getHeaders() }).pipe(
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

  // In ProductOrderService
  getOrderByProduct(productId: string) {
    return this.http.get(`${this.baseUrl}/${productId}`, { headers: this.getHeaders() }).pipe(
      map((res: any) => res), // just return response
      catchError((err) => {
        return throwError(() => err);
      }),
    );
  }

  getMyOrders(page = 1, limit = 10) {
    return this.http.get(`${this.baseUrl}/orders?page=${page}&limit=${limit}`, {
      headers: this.getHeaders(),
    });
  }

  // Update order status (cancel, complete, etc.)
  updateOrderStatus(
    orderId: string,
    data: { status: string; rating?: number; comment?: string; cancelReason?: string },
  ) {
    return this.http
      .put(`${this.baseUrl}/${orderId}`, data, {
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
}
