import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { env } from '../../environments/env';
import { catchError, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductOrderService {
  private baseUrl = `${env.BASE_URL}/productOrder`;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // get token from storage
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    });
  }

  // ✅ Confirm payment
  confirmPayment(sessionId: string) {
    return this.http
      .post(
        `${this.baseUrl}/confirm-payment`,
        { sessionId },
        { headers: this.getHeaders() }
      )
      .pipe(
        map((res: any) => {
          this.toastr.success(res.message || 'Payment confirmed successfully!');
          return res;
        }),
        catchError((err) => {
          this.toastr.error(
            err?.error?.message || 'Payment confirmation failed'
          );
          return throwError(() => err);
        })
      );
  }

  // ✅ Create order
  createOrder(orderData: any) {
    return this.http
      .post(`${this.baseUrl}`, orderData, { headers: this.getHeaders() })
      .pipe(
        map((res: any) => {
          this.toastr.success(res.message || 'Order placed successfully!');
          return res;
        }),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Failed to place order');
          return throwError(() => err);
        })
      );
  }

  // In ProductOrderService
  getOrderByProduct(productId: string) {
    return this.http
      .get(`${this.baseUrl}/${productId}`, { headers: this.getHeaders() })
      .pipe(
        map((res: any) => res), // just return response
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }

  // Update order status (cancel, complete, etc.)
  updateOrderStatus(
    orderId: string,
    data: { status: string; rating?: number; comment?: string }
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
        })
      );
  }
}
