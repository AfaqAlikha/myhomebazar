import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
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

interface PublicShippingSettings {
  baseFee?: number;
  freeAbove?: number;
  defaultWeightKg?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ShippingService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly fallbackSettings: Required<PublicShippingSettings> = {
    baseFee: 300,
    freeAbove: 5000,
    defaultWeightKg: 0.5,
  };

  private publicSettings$ = this.http
    .get<{ settings: PublicShippingSettings }>(API_ENDPOINTS.shipping.publicSettings)
    .pipe(
      map((res) => ({
        baseFee: Number(res.settings?.baseFee) || this.fallbackSettings.baseFee,
        freeAbove: Number(res.settings?.freeAbove) || this.fallbackSettings.freeAbove,
        defaultWeightKg:
          Number(res.settings?.defaultWeightKg) || this.fallbackSettings.defaultWeightKg,
      })),
      catchError(() => of({ ...this.fallbackSettings })),
      shareReplay(1),
    );

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  private normalizeQuote(raw: Partial<ShippingQuote> | undefined, subtotal: number): ShippingQuote {
    const shippingFee = Number(raw?.shippingFee) || 0;
    const normalizedSubtotal = Number(raw?.subtotal ?? subtotal) || subtotal;
    const freeShippingThreshold =
      Number(raw?.freeShippingThreshold) || this.fallbackSettings.freeAbove;

    return {
      subtotal: normalizedSubtotal,
      shippingFee,
      grandTotal: Number(raw?.grandTotal ?? normalizedSubtotal + shippingFee) || normalizedSubtotal + shippingFee,
      isFreeShipping: raw?.isFreeShipping ?? shippingFee === 0,
      freeShippingThreshold,
      message: raw?.message || (shippingFee === 0 ? 'Free delivery' : `Delivery: Rs ${shippingFee}`),
      cityFee: raw?.cityFee,
      weightFee: raw?.weightFee,
      totalWeightKg: raw?.totalWeightKg,
      city: raw?.city ?? null,
    };
  }

  private buildFallbackQuote(
    subtotal: number,
    settings: PublicShippingSettings,
    options?: { city?: string; weightKg?: number },
  ): ShippingQuote {
    const freeAbove = Number(settings.freeAbove) || this.fallbackSettings.freeAbove;
    const baseFee = Number(settings.baseFee) || this.fallbackSettings.baseFee;

    if (subtotal >= freeAbove) {
      return {
        subtotal,
        shippingFee: 0,
        grandTotal: subtotal,
        isFreeShipping: true,
        freeShippingThreshold: freeAbove,
        message: `Free delivery on orders above Rs ${freeAbove}`,
        city: options?.city?.trim() || null,
        totalWeightKg: options?.weightKg,
      };
    }

    return {
      subtotal,
      shippingFee: baseFee,
      grandTotal: subtotal + baseFee,
      isFreeShipping: false,
      freeShippingThreshold: freeAbove,
      message: `Standard delivery: Rs ${baseFee}`,
      city: options?.city?.trim() || null,
      totalWeightKg: options?.weightKg,
    };
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
      .get<{ success?: boolean; data: ShippingQuote }>(
        `${API_ENDPOINTS.shipping.quote}?${params.toString()}`,
      )
      .pipe(
        map((res) => this.normalizeQuote(res.data, subtotal)),
        catchError(() =>
          this.publicSettings$.pipe(
            map((settings) => this.buildFallbackQuote(subtotal, settings, options)),
          ),
        ),
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
