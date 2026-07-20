import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SpinnerService } from '../../shared/spinner.service';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { StarRatingComponent } from '../../shared/star-rating/star-rating.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductOrderService } from '../../services/product-order.service';
import { ClaimsService } from '../../services/claims.service';
import { ShippingService, OrderTracking } from '../../services/shipping.service';
import { CLAIM_REASONS } from '../../core/config/api-endpoints';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';

type ReviewModalMode = 'complete' | 'standalone';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    UiCardComponent,
    UiButtonComponent,
    StarRatingComponent,
    MatPaginatorModule,
    MatIconModule,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './order-history.html',
  styleUrls: ['./order-history.css'],
})
export class OrderHistoryComponent implements OnInit, OnDestroy {
  orders: any[] = [];

  totalItems = 0;
  itemsPerPage = 10;
  currentPage = 1;
  loading = false;

  reviewModal = false;
  reviewModalClosing = false;
  reviewModalMode: ReviewModalMode = 'standalone';
  selectedOrder: any = null;
  reviewForm!: FormGroup;
  reviewSubmitting = false;
  highlightedOrderId: string | null = null;
  expandedOrderIds = new Set<string>();
  reviewRevealOrderIds = new Set<string>();

  cancelModal = false;
  selectedCancelOrder: any = null;
  cancelForm!: FormGroup;
  cancelSubmitting = false;

  claimModal = false;
  selectedClaimOrder: any = null;
  claimForm!: FormGroup;
  claimSubmitting = false;
  claimReasons = CLAIM_REASONS;
  claimImageFiles: File[] = [];
  claimImagePreviews: string[] = [];
  trackingByOrder: Record<string, OrderTracking> = {};
  syncingTrackingId: string | null = null;

  reviewModalLocked = false;
  reviewModalSecondsLeft = 0;

  private previousStatuses = new Map<string, string>();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private reviewModalTimer: ReturnType<typeof setInterval> | null = null;
  private highlightTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private orderService: ProductOrderService,
    private claimsService: ClaimsService,
    private shippingService: ShippingService,
    private fb: FormBuilder,
    private spinnerService: SpinnerService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(0.5), Validators.max(5)]],
      comment: [''],
    });
    this.cancelForm = this.fb.group({
      cancelReason: ['', Validators.required],
    });
    this.claimForm = this.fb.group({
      reason: ['', Validators.required],
      description: ['', Validators.required],
    });

    this.loadOrders();
    this.pollInterval = setInterval(() => this.silentRefreshOrders(), 15000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.clearReviewModalTimer();
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
  }

  canCancel(order: any): boolean {
    return ['pending', 'confirmed', 'accepted', 'shipped'].includes(order.status);
  }

  getOrderSubtotal(order: any): number {
    if (order.subtotal != null) return order.subtotal;
    if (order.price != null) return order.price;
    return (order.product?.price || 0) * (order.quantity || 1);
  }

  getOrderShipping(order: any): number {
    return order.shippingFee ?? 0;
  }

  getOrderGrandTotal(order: any): number {
    return order.totalPrice ?? this.getOrderSubtotal(order) + this.getOrderShipping(order);
  }

  getStatusLabel(order: any): string {
    return String(order.status || '').toUpperCase();
  }

  getStatusClass(order: any): string {
    return order.status;
  }

  hasTracking(order: any): boolean {
    return !!(order.trackingNumber || this.trackingByOrder[order._id]?.trackingNumber);
  }

  getTrackingNumber(order: any): string {
    return order.trackingNumber || this.trackingByOrder[order._id]?.trackingNumber || '';
  }

  getTrackingUrl(order: any): string {
    return order.trackingUrl || this.trackingByOrder[order._id]?.trackingUrl || '';
  }

  getShipmentStatus(order: any): string {
    return order.shipmentStatus || this.trackingByOrder[order._id]?.shipmentStatus || '';
  }

  isReviewRevealed(orderId: string): boolean {
    return this.reviewRevealOrderIds.has(orderId);
  }

  refreshTracking(order: any): void {
    this.syncingTrackingId = order._id;
    this.shippingService.syncOrderTracking(order._id).subscribe({
      next: (data) => {
        this.trackingByOrder[order._id] = data;
        if (data.shipmentStatus) order.shipmentStatus = data.shipmentStatus;
        if (data.trackingNumber) order.trackingNumber = data.trackingNumber;
        if (data.trackingUrl) order.trackingUrl = data.trackingUrl;
        if (data.courierPartner) order.courierPartner = data.courierPartner;
        if (data.shipmentStatus === 'delivered' && order.status === 'shipped') {
          order.status = 'delivered';
          order.canReview = true;
          order.canClaim = true;
        }
        this.syncingTrackingId = null;
      },
      error: () => {
        this.syncingTrackingId = null;
      },
    });
  }

  toggleOrderDetails(orderId: string): void {
    if (this.expandedOrderIds.has(orderId)) {
      this.expandedOrderIds.delete(orderId);
    } else {
      this.expandedOrderIds.add(orderId);
    }
  }

  isOrderExpanded(orderId: string): boolean {
    return this.expandedOrderIds.has(orderId);
  }

  closeReviewModal(): void {
    if (this.reviewModalLocked) return;

    if (this.reviewModalMode === 'complete' && this.selectedOrder) {
      this.finishCompleteOrder();
      return;
    }

    this.reviewModalClosing = true;
    setTimeout(() => {
      this.reviewModal = false;
      this.reviewModalClosing = false;
      this.selectedOrder = null;
      this.clearReviewModalTimer();
    }, 200);
  }

  skipReviewAndComplete(): void {
    if (this.reviewModalMode !== 'complete' || !this.selectedOrder) {
      this.closeReviewModal();
      return;
    }
    this.finishCompleteOrder();
  }

  closeClaimModal(): void {
    this.claimModal = false;
    this.clearClaimImages();
  }

  pageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadOrders();
  }

  loadOrders(openReviewForOrderId?: string): void {
    this.loading = true;
    this.spinnerService.show();

    this.orderService.getMyOrders(this.currentPage, this.itemsPerPage).subscribe({
      next: (res: any) => {
        this.applyOrdersResponse(res, { openReviewForOrderId, detectChanges: false });
        this.loading = false;
        this.spinnerService.hide();
      },
      error: () => {
        this.loading = false;
        this.spinnerService.hide();
      },
    });
  }

  silentRefreshOrders(): void {
    if (this.loading || this.reviewModal) return;

    this.orderService.getMyOrders(this.currentPage, this.itemsPerPage).subscribe({
      next: (res: any) => {
        this.applyOrdersResponse(res, { detectChanges: true });
      },
    });
  }

  private applyOrdersResponse(
    res: any,
    options: { openReviewForOrderId?: string; detectChanges?: boolean } = {},
  ): void {
    const newOrders = res.orders || [];
    if (options.detectChanges) {
      this.detectStatusChanges(newOrders);
    }

    this.orders = newOrders;
    this.totalItems = res.pagination?.totalItems || 0;
    this.itemsPerPage = res.pagination?.pageSize || this.itemsPerPage;
    this.currentPage = res.pagination?.currentPage || this.currentPage;

    newOrders.forEach((order: any) => {
      if (!this.previousStatuses.has(order._id)) {
        this.previousStatuses.set(order._id, order.status);
        if (order.status === 'delivered') {
          this.promptDeliveredOrder(order);
        }
      }
      if (order.hasReviewed && order.review) {
        this.reviewRevealOrderIds.add(order._id);
      }
    });

    const reviewOrderId =
      options.openReviewForOrderId || this.route.snapshot.queryParamMap.get('reviewOrderId');
    if (reviewOrderId) {
      const order = this.orders.find((o) => o._id === reviewOrderId);
      if (order?.canReview && !order?.hasReviewed) {
        this.reviewOrder(order);
      }
    }
  }

  private detectStatusChanges(newOrders: any[]): void {
    for (const order of newOrders) {
      const previousStatus = this.previousStatuses.get(order._id);
      if (previousStatus && previousStatus !== order.status && order.status === 'delivered') {
        this.promptDeliveredOrder(order);
      }
      this.previousStatuses.set(order._id, order.status);
    }
  }

  private promptDeliveredOrder(order: any): void {
    const storageKey = `delivery_prompt_${order._id}`;
    if (sessionStorage.getItem(storageKey)) return;

    sessionStorage.setItem(storageKey, '1');
    this.completeOrder(order, true);
  }

  private startReviewModalTimer(seconds = 60): void {
    this.clearReviewModalTimer();
    this.reviewModalLocked = true;
    this.reviewModalSecondsLeft = seconds;

    this.reviewModalTimer = setInterval(() => {
      this.reviewModalSecondsLeft -= 1;
      if (this.reviewModalSecondsLeft <= 0) {
        this.reviewModalLocked = false;
        this.clearReviewModalTimer();
      }
    }, 1000);
  }

  private clearReviewModalTimer(): void {
    if (this.reviewModalTimer) {
      clearInterval(this.reviewModalTimer);
      this.reviewModalTimer = null;
    }
    this.reviewModalLocked = false;
    this.reviewModalSecondsLeft = 0;
  }

  cancelOrder(order: any): void {
    this.selectedCancelOrder = order;
    this.cancelForm.reset({ cancelReason: '' });
    this.cancelModal = true;
  }

  closeCancelModal(): void {
    this.cancelModal = false;
  }

  completeOrder(order: any, autoPrompt = false): void {
    this.selectedOrder = order;
    this.reviewModalMode = 'complete';
    this.reviewForm.reset({ rating: 0, comment: '' });
    this.reviewModal = true;
    this.reviewModalClosing = false;
    if (autoPrompt) {
      this.startReviewModalTimer(60);
    }
  }

  reviewOrder(order: any): void {
    this.selectedOrder = order;
    this.reviewModalMode = 'standalone';
    this.reviewForm.reset({ rating: 0, comment: '' });
    this.reviewModal = true;
    this.reviewModalClosing = false;
  }

  fileClaim(order: any): void {
    this.selectedClaimOrder = order;
    this.claimForm.reset({ reason: '', description: '' });
    this.clearClaimImages();
    this.claimModal = true;
  }

  onClaimImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    const remaining = 5 - this.claimImageFiles.length;
    const toAdd = files.slice(0, remaining);

    toAdd.forEach((file) => {
      this.claimImageFiles.push(file);
      this.claimImagePreviews.push(URL.createObjectURL(file));
    });

    input.value = '';
  }

  removeClaimImage(index: number): void {
    URL.revokeObjectURL(this.claimImagePreviews[index]);
    this.claimImageFiles.splice(index, 1);
    this.claimImagePreviews.splice(index, 1);
  }

  clearClaimImages(): void {
    this.claimImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    this.claimImageFiles = [];
    this.claimImagePreviews = [];
  }

  getClaimCountdownLabel(order: any): string {
    if (!order.canClaim || order.hasClaimed) return '';
    const days = order.claimDaysRemaining ?? 0;
    if (days <= 0) return 'Claim window expired';
    if (days === 1) return '1 day left to claim';
    return `${days} days left to claim`;
  }

  submitCancelOrder(): void {
    if (this.cancelForm.invalid) {
      this.cancelForm.markAllAsTouched();
      return;
    }

    this.cancelSubmitting = true;
    this.orderService
      .updateOrderStatus(this.selectedCancelOrder._id, {
        status: 'cancelled',
        cancelReason: this.cancelForm.value.cancelReason,
      })
      .subscribe({
        next: () => {
          this.cancelSubmitting = false;
          this.cancelModal = false;
          this.loadOrders();
        },
        error: () => {
          this.cancelSubmitting = false;
        },
      });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const { rating, comment } = this.reviewForm.value;
    this.reviewSubmitting = true;

    if (this.reviewModalMode === 'complete') {
      this.orderService
        .updateOrderStatus(this.selectedOrder._id, {
          status: 'completed',
          rating,
          comment,
        })
        .subscribe({
          next: () => {
            this.onCompleteSuccess(this.selectedOrder._id, true, { rating, comment });
          },
          error: () => {
            this.reviewSubmitting = false;
          },
        });
      return;
    }

    this.orderService.submitReview(this.selectedOrder._id, { rating, comment }).subscribe({
      next: () => {
        this.onReviewSubmitted(this.selectedOrder._id, { rating, comment });
      },
      error: () => {
        this.reviewSubmitting = false;
      },
    });
  }

  private finishCompleteOrder(): void {
    if (!this.selectedOrder) return;

    this.reviewSubmitting = true;
    this.orderService
      .updateOrderStatus(this.selectedOrder._id, { status: 'completed' })
      .subscribe({
        next: () => {
          this.onCompleteSuccess(this.selectedOrder._id, false);
        },
        error: () => {
          this.reviewSubmitting = false;
        },
      });
  }

  private onReviewSubmitted(
    orderId: string,
    review: { rating: number; comment?: string },
  ): void {
    this.reviewSubmitting = false;
    this.reviewModal = false;
    this.selectedOrder = null;
    this.clearReviewModalTimer();
    this.revealReviewOnCard(orderId, review);
    this.loadOrders(orderId);
  }

  private onCompleteSuccess(
    orderId: string,
    withReview: boolean,
    review?: { rating: number; comment?: string },
  ): void {
    this.reviewSubmitting = false;
    this.reviewModalClosing = true;

    setTimeout(() => {
      this.reviewModal = false;
      this.reviewModalClosing = false;
      this.selectedOrder = null;
      this.clearReviewModalTimer();

      if (withReview && review) {
        this.revealReviewOnCard(orderId, review);
      } else {
        this.highlightOrder(orderId, 60000);
        this.expandedOrderIds.add(orderId);
      }

      this.loadOrders(orderId);
    }, 350);
  }

  private revealReviewOnCard(
    orderId: string,
    review: { rating: number; comment?: string },
  ): void {
    const order = this.orders.find((item) => item._id === orderId);
    if (order) {
      order.hasReviewed = true;
      order.canReview = false;
      order.review = {
        rating: review.rating,
        comment: review.comment || '',
        createdAt: new Date().toISOString(),
      };
      order.status = 'completed';
    }

    this.reviewRevealOrderIds.add(orderId);
    this.expandedOrderIds.add(orderId);
    this.highlightOrder(orderId, 60000);
  }

  private highlightOrder(orderId: string, durationMs: number): void {
    this.highlightedOrderId = orderId;
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.highlightTimer = setTimeout(() => {
      this.highlightedOrderId = null;
    }, durationMs);
  }

  submitClaim(): void {
    if (this.claimForm.invalid) {
      this.claimForm.markAllAsTouched();
      return;
    }

    this.claimSubmitting = true;
    this.claimsService
      .createClaim({
        orderId: this.selectedClaimOrder._id,
        reason: this.claimForm.value.reason,
        description: this.claimForm.value.description,
        images: this.claimImageFiles,
      })
      .subscribe({
        next: () => {
          this.claimSubmitting = false;
          this.claimModal = false;
          this.clearClaimImages();
          this.loadOrders();
        },
        error: () => {
          this.claimSubmitting = false;
        },
      });
  }
}
