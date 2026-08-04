import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiInputComponent } from '../shared/ui-input/ui-input.component';
import { UiButtonComponent } from '../shared/ui-button/ui-button.component';
import { ProductOrderService } from '../services/product-order.service';
import { pakistaniPhoneValidator } from '../utils/pakistani-phone.validator';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    DatePipe,
    DecimalPipe,
    UiCardComponent,
    UiInputComponent,
    UiButtonComponent,
  ],
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.css'],
})
export class TrackOrderComponent {
  form: FormGroup;
  loading = false;
  order: any = null;
  error = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private productOrderService: ProductOrderService,
  ) {
    this.form = this.fb.group({
      orderId: ['', Validators.required],
      phone: ['', [Validators.required, pakistaniPhoneValidator]],
    });

    const orderId = this.route.snapshot.queryParamMap.get('orderId');
    if (orderId) {
      this.form.patchValue({ orderId });
    }
  }

  track(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.order = null;

    const { orderId, phone } = this.form.value;
    this.productOrderService.trackGuestOrder(orderId, phone).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.order = res?.order || res?.data?.order || null;
        if (!this.order) {
          this.error = 'Order not found. Please check your details.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Order not found. Please check your details.';
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }
}
