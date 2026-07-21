import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { API_ENDPOINTS } from '../core/config/api-endpoints';

export interface PaymentMethodOption {
  value: string;
  label: string;
  subtitle: string;
  icon: string;
  accent: string;
  online?: boolean;
}

export interface PublicPaymentSettings {
  enabledMethods: string[];
  methods: PaymentMethodOption[];
}

@Injectable({
  providedIn: 'root',
})
export class PaymentSettingsService {
  private readonly http = inject(HttpClient);

  private readonly fallbackMethods: PaymentMethodOption[] = [
    {
      value: 'COD',
      label: 'Cash on Delivery',
      subtitle: 'Pay when your order arrives',
      icon: 'local_shipping',
      accent: '#16a34a',
      online: false,
    },
  ];

  private orderMethods$ = this.http
    .get<PublicPaymentSettings | { settings: PublicPaymentSettings }>(
      API_ENDPOINTS.payments.publicSettings,
      { params: new HttpParams().set('context', 'order') },
    )
    .pipe(
      map((res) => this.unwrapSettings(res)),
      catchError(() => of({ enabledMethods: ['COD'], methods: this.fallbackMethods })),
      shareReplay(1),
    );

  getOrderMethods(): Observable<PublicPaymentSettings> {
    return this.orderMethods$;
  }

  private unwrapSettings(
    res: PublicPaymentSettings | { settings?: PublicPaymentSettings },
  ): PublicPaymentSettings {
    if ('settings' in res && res.settings) {
      return res.settings;
    }
    return res as PublicPaymentSettings;
  }
}
