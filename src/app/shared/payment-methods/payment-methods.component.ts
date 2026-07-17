import { Component, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaymentMethodOption } from '../../services/payment-gateway.service';

interface PaymentOption {
  value: PaymentMethodOption;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
}

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './payment-methods.component.html',
  styleUrls: ['./payment-methods.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaymentMethodsComponent),
      multi: true,
    },
  ],
})
export class PaymentMethodsComponent implements ControlValueAccessor {
  value: PaymentMethodOption = 'COD';
  disabled = false;

  options: PaymentOption[] = [
    {
      value: 'COD',
      title: 'Cash on Delivery',
      subtitle: 'Pay when your order arrives',
      icon: 'local_shipping',
      accent: '#16a34a',
    },
    {
      value: 'JazzCash',
      title: 'JazzCash',
      subtitle: 'Mobile wallet — Pakistan',
      icon: 'account_balance_wallet',
      accent: '#dc2626',
    },
    {
      value: 'EasyPaisa',
      title: 'EasyPaisa',
      subtitle: 'Mobile wallet — Pakistan',
      icon: 'payments',
      accent: '#059669',
    },
    {
      value: 'Card',
      title: 'Credit / Debit Card',
      subtitle: 'Visa, Mastercard via secure gateway',
      icon: 'credit_card',
      accent: '#2563eb',
    },
  ];

  private onChange: (v: PaymentMethodOption) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: PaymentMethodOption | null): void {
    this.value = value || 'COD';
  }

  registerOnChange(fn: (v: PaymentMethodOption) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  select(method: PaymentMethodOption): void {
    if (this.disabled) return;
    this.value = method;
    this.onChange(method);
    this.onTouched();
  }
}
