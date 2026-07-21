import { Component, forwardRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  PaymentMethodOption,
  PaymentSettingsService,
} from '../../services/payment-settings.service';

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
export class PaymentMethodsComponent implements ControlValueAccessor, OnInit {
  private readonly paymentSettingsService = inject(PaymentSettingsService);

  value = '';
  disabled = false;
  options: PaymentMethodOption[] = [];
  loading = true;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.paymentSettingsService.getOrderMethods().subscribe({
      next: (settings) => {
        this.options = settings.methods || [];
        this.loading = false;
        if (!this.value && this.options.length) {
          this.select(this.options[0].value);
        } else if (this.value && !this.options.some((opt) => opt.value === this.value)) {
          this.select(this.options[0]?.value || '');
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  writeValue(value: string | null): void {
    this.value = value || '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  select(method: string): void {
    if (this.disabled || !method) return;
    this.value = method;
    this.onChange(method);
    this.onTouched();
  }
}
