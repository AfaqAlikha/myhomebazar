import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiInputComponent } from '../shared/ui-input/ui-input.component';
import { UiButtonComponent } from '../shared/ui-button/ui-button.component';
import { ProductOrderService } from '../services/product-order.service';
import { pakistaniPhoneValidator } from '../utils/pakistani-phone.validator';

type TrackStep = {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
};

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgFor,
    DatePipe,
    DecimalPipe,
    MatIconModule,
    MatProgressSpinnerModule,
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
  actionLoading = false;
  order: any = null;
  error = '';

  /** Guest UI: timeline stops at delivered; confirm moves to completed in backend only. */
  readonly guestTimelineFlow = ['pending', 'confirmed', 'shipped', 'delivered'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private productOrderService: ProductOrderService,
    private toastr: ToastrService,
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

  completeOrder(): void {
    if (!this.order) return;

    const { orderId, phone } = this.form.value;
    const payload = { orderId, phone };

    this.actionLoading = true;
    this.productOrderService.completeGuestOrder(payload).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        this.order = res?.order || this.order;
        this.toastr.success(res?.message || 'Order completed successfully');
        this.track();
      },
      error: (err) => {
        this.actionLoading = false;
        this.toastr.error(err?.error?.message || 'Could not complete order');
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Order received',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    if (status === 'completed') return 'status-pill status-pill--success';
    if (status === 'delivered') return 'status-pill status-pill--info';
    if (status === 'cancelled') return 'status-pill status-pill--danger';
    if (status === 'shipped') return 'status-pill status-pill--accent';
    return 'status-pill';
  }

  getTimelineSteps(): TrackStep[] {
    const current = this.order?.status;
    const effectiveStatus = current === 'completed' ? 'delivered' : current;
    const currentIndex = this.guestTimelineFlow.indexOf(effectiveStatus);

    return this.guestTimelineFlow.map((key, index) => ({
      key,
      label: this.getStatusLabel(key),
      done:
        current !== 'cancelled' &&
        (currentIndex > index || (current === 'completed' && key === 'delivered')),
      active: effectiveStatus === key && current !== 'completed',
    }));
  }

  isGuestOrderReceived(): boolean {
    return this.order?.status === 'completed';
  }

  getOrderSubtotal(): number {
    return Number(this.order?.price ?? this.order?.subtotal ?? 0);
  }

  getOrderShipping(): number {
    return Number(this.order?.shippingFee ?? 0);
  }

  getOrderTotal(): number {
    return Number(this.order?.totalPrice ?? this.getOrderSubtotal() + this.getOrderShipping());
  }

  canComplete(): boolean {
    if (this.order?.status === 'completed' || this.order?.status === 'cancelled') {
      return false;
    }
    return Boolean(this.order?.canComplete || this.order?.status === 'delivered');
  }

}
