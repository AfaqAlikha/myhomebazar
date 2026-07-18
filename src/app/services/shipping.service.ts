import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { AuthService } from '../auth/auth.service';

export interface ShippingQuote {
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  message: string;
  cityFee?: number;
  weightFee?: number;
  totalWeightKg?: number;
  city?: string | null;
}

export interface OrderTracking {
  orderId: string;
  courierPartner?: string;
  trackingNumber?: string | null;
  trackingUrl?: string;
  shipmentStatus?: string;
  events?: Array<{ status: string; location?: string; at?: string }>;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ShippingService {
  private readonly defaultQuote: ShippingQuote = {
    subtotal: 0,
    shippingFee: 300,
    grandTotal: 300,
    isFreeShipping: false,
    freeShippingThreshold: 5000,
    message: 'Standard delivery: Rs 300',
  };

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  getQuote(
    subtotal: number,
    options?: { city?: string; weightKg?: number },
  ): Observable<ShippingQuote> {
    const params = new URLSearchParams({ subtotal: String(subtotal) });
    if (options?.city?.trim()) params.set('city', options.city.trim());
    if (options?.weightKg && options.weightKg > 0) {
      params.set('weightKg', String(options.weightKg));
    }

    return this.http
      .get<{ data: ShippingQuote }>(`${API_ENDPOINTS.shipping.quote}?${params.toString()}`)
      .pipe(
        map((res) => res.data),
        catchError(() => {
          const fee = subtotal >= this.defaultQuote.freeShippingThreshold ? 0 : 300;
          return of({
            subtotal,
            shippingFee: fee,
            grandTotal: subtotal + fee,
            isFreeShipping: fee === 0,
            freeShippingThreshold: this.defaultQuote.freeShippingThreshold,
            message: fee === 0 ? 'Free delivery' : `Standard delivery: Rs ${fee}`,
          });
        }),
      );
  }

  getOrderTracking(orderId: string): Observable<OrderTracking> {
    return this.http
      .get<{ data: OrderTracking }>(`${API_ENDPOINTS.shipping.tracking(orderId)}`, {
        headers: this.authHeaders(),
      })
      .pipe(map((res) => res.data));
  }

  syncOrderTracking(orderId: string): Observable<OrderTracking> {
    return this.http
      .post<{ data: OrderTracking; message?: string }>(
        `${API_ENDPOINTS.shipping.syncTracking(orderId)}`,
        {},
        { headers: this.authHeaders() },
      )
      .pipe(map((res) => res.data));
  }
}
