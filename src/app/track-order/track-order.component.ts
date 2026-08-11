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
import { StarRatingComponent } from '../shared/star-rating/star-rating.component';
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
    StarRatingComponent,
  ],
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.css'],
})
export class TrackOrderComponent {
  form: FormGroup;
  reviewForm: FormGroup;
  completeForm: FormGroup;
  loading = false;
  actionLoading = false;
  order: any = null;
  error = '';
  showReviewOnComplete = false;

  readonly statusFlow = ['pending', 'confirmed', 'shipped', 'delivered', 'completed'];

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

    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(0.5)]],
      comment: [''],
    });

    this.completeForm = this.fb.group({
      rating: [0, [Validators.min(0.5)]],
      comment: [''],
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
    this.showReviewOnComplete = false;

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

  completeOrder(withReview = false): void {
    if (!this.order) return;

    const { orderId, phone } = this.form.value;
    const payload: any = { orderId, phone };

    if (withReview) {
      const { rating, comment } = this.completeForm.value;
      if (!rating || rating < 0.5) {
        this.toastr.warning('Please select a rating before submitting.');
        return;
      }
      payload.rating = rating;
      payload.comment = comment?.trim() || '';
    }

    this.actionLoading = true;
    this.productOrderService.completeGuestOrder(payload).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        this.order = res?.order || this.order;
        this.toastr.success(res?.message || 'Order completed successfully');
        this.showReviewOnComplete = false;
        this.track();
      },
      error: (err) => {
        this.actionLoading = false;
        this.toastr.error(err?.error?.message || 'Could not complete order');
      },
    });
  }

  submitReview(): void {
    if (!this.order || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const { orderId, phone } = this.form.value;
    const { rating, comment } = this.reviewForm.value;

    this.actionLoading = true;
    this.productOrderService.reviewGuestOrder({ orderId, phone, rating, comment }).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        this.order = res?.order || this.order;
        this.toastr.success(res?.message || 'Review submitted');
        this.track();
      },
      error: (err) => {
        this.actionLoading = false;
        this.toastr.error(err?.error?.message || 'Could not submit review');
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

  getStatusClass(status: string): string {
    if (status === 'completed') return 'status-pill status-pill--success';
    if (status === 'delivered') return 'status-pill status-pill--info';
    if (status === 'cancelled') return 'status-pill status-pill--danger';
    if (status === 'shipped') return 'status-pill status-pill--accent';
    return 'status-pill';
  }

  getTimelineSteps(): TrackStep[] {
    const current = this.order?.status;
    const currentIndex = this.statusFlow.indexOf(current);

    return this.statusFlow.map((key, index) => ({
      key,
      label: this.getStatusLabel(key),
      done: currentIndex >= index && current !== 'cancelled',
      active: current === key,
    }));
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
    return this.order?.canComplete || this.order?.status === 'delivered';
  }

  canReview(): boolean {
    return Boolean(this.order?.canReview && !this.order?.hasReviewed);
  }

  hasReview(): boolean {
    return Boolean(this.order?.hasReviewed && this.order?.review);
  }
}
