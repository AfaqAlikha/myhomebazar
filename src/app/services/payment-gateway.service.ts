import { Injectable } from '@angular/core';

export type PaymentMethodOption = 'COD' | 'JazzCash' | 'EasyPaisa' | 'Card';

export interface GatewayCheckout {
  basketId: string;
  redirectUrl: string;
  formFields: Record<string, string>;
  mockMode?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PaymentGatewayService {
  redirectToGateway(checkout: GatewayCheckout): void {
    if (!checkout?.redirectUrl) return;

    if (checkout.mockMode) {
      const params = new URLSearchParams({
        basketId: checkout.basketId,
        status: checkout.formFields?.['status'] || 'success',
        mock: 'true',
      });
      window.location.href = `${checkout.redirectUrl}?${params.toString()}`;
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = checkout.redirectUrl;

    Object.entries(checkout.formFields || {}).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }
}
