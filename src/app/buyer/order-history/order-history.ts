import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
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
import { AuthService } from '../../auth/auth.service';
import {
  OrderStatusUpdatePayload,
  SocketService,
} from '../../core/services/socket.service';

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

  completeConfirmModal = false;
  reviewModal = false;
  reviewModalClosing = false;
  selectedOrder: any = null;
  reviewForm!: FormGroup;
  reviewSubmitting = false;
  completeSubmitting = false;
  highlightedOrderId: string | null = null;
  expandedOrderIds = new Set<string>();
  reviewRevealOrderIds = new Set<string>();
  pendingReviewReveal: { orderId: string; review: { rating: number; comment?: string } } | null =
    null;

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

  reviewModalSecondsLeft = 0;

  private previousStatuses = new Map<string, string>();
  private reviewModalTimer: ReturnType<typeof setInterval> | null = null;
  private reviewRevealTimer: ReturnType<typeof setTimeout> | null = null;
  private highlightTimer: ReturnType<typeof setTimeout> | null = null;
  private statusUpdateSub?: Subscription;
  private visibilityHandler = () => this.onPageVisible();

  constructor(
    private orderService: ProductOrderService,
    private claimsService: ClaimsService,
    private shippingService: ShippingService,
    private fb: FormBuilder,
    private spinnerService: SpinnerService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    this.reviewForm = this.fb.group({
      rating: [0],
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
    this.initRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this.clearReviewModalTimer();
    if (this.reviewRevealTimer) clearTimeout(this.reviewRevealTimer);
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.statusUpdateSub?.unsubscribe();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  private initRealtimeUpdates(): void {
    const user = this.authService.getUser();
    if (!user?.id) return;

    this.socketService.connect(user.id);
    this.statusUpdateSub = this.socketService.orderStatusUpdate$.subscribe((payload) => {
      this.applyOrderStatusUpdate(payload);
    });

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private onPageVisible(): void {
    if (document.visibilityState === 'visible') {
      this.refreshOrdersSilently();
    }
  }

  private applyOrderStatusUpdate(payload: OrderStatusUpdatePayload): void {
    const orderId = String(payload.orderId);
    const order = this.orders.find((item) => String(item._id) === orderId);
    if (!order) {
      this.refreshOrdersSilently();
      return;
    }

    const previousStatus = order.status;
    order.status = payload.status;

    if (payload.shipmentStatus) order.shipmentStatus = payload.shipmentStatus;
    if (payload.deliveredAt) order.deliveredAt = payload.deliveredAt;
    if (payload.canReview != null) order.canReview = payload.canReview;
    if (payload.canClaim != null) order.canClaim = payload.canClaim;
    if (payload.trackingNumber) order.trackingNumber = payload.trackingNumber;
    if (payload.courierPartner) order.courierPartner = payload.courierPartner;

    if (payload.status === 'delivered' && previousStatus !== 'delivered') {
      this.highlightOrder(orderId, 10000);
      this.expandedOrderIds.add(orderId);
    }
  }

  canCancel(order: any): boolean {
    return ['pending', 'confirmed', 'accepted', 'shipped', 'delivered'].includes(order.status);
  }

  canComplete(order: any): boolean {
    return order.status === 'delivered';
  }

  canWriteReview(order: any): boolean {
    return (
      !order.hasReviewed &&
      order.status === 'completed' &&
      (order.canReview !== false)
    );
  }

  canFileClaim(order: any): boolean {
    return (
      !!order.canClaim &&
      !order.hasClaimed &&
      order.status === 'completed'
    );
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
          this.highlightOrder(order._id, 10000);
          this.expandedOrderIds.add(order._id);
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

  openCompleteConfirm(order: any): void {
    this.selectedOrder = order;
    this.completeConfirmModal = true;
  }

  closeCompleteConfirm(): void {
    this.completeConfirmModal = false;
    if (!this.reviewModal) {
      this.selectedOrder = null;
    }
  }

  executeCompleteOrder(): void {
    if (!this.selectedOrder || this.completeSubmitting) return;

    this.completeSubmitting = true;
    this.orderService.updateOrderStatus(this.selectedOrder._id, { status: 'completed' }).subscribe({
      next: () => {
        const orderId = this.selectedOrder._id;
        const productName = this.selectedOrder.product?.name;
        this.completeSubmitting = false;
        this.completeConfirmModal = false;

        const order = this.orders.find((item) => item._id === orderId);
        if (order) {
          order.status = 'completed';
          order.completedAt = new Date().toISOString();
          order.canReview = !order.hasReviewed;
        }

        this.highlightOrder(orderId, 30000);
        this.expandedOrderIds.add(orderId);
        this.loadOrders();

        this.openOptionalReviewModal({ _id: orderId, product: { name: productName } });
      },
      error: () => {
        this.completeSubmitting = false;
      },
    });
  }

  openOptionalReviewModal(order: any): void {
    this.selectedOrder = order;
    this.reviewForm.reset({ rating: 0, comment: '' });
    this.reviewModal = true;
    this.reviewModalClosing = false;
    this.startReviewModalTimer(30);
  }

  reviewOrder(order: any): void {
    this.openOptionalReviewModal(order);
  }

  closeReviewModal(): void {
    if (this.reviewModalSecondsLeft > 0) return;

    this.skipReview();
  }

  skipReview(): void {
    this.pendingReviewReveal = null;
    if (this.reviewRevealTimer) {
      clearTimeout(this.reviewRevealTimer);
      this.reviewRevealTimer = null;
    }
    this.reviewModalClosing = true;
    setTimeout(() => {
      this.reviewModal = false;
      this.reviewModalClosing = false;
      this.selectedOrder = null;
      this.clearReviewModalTimer();
    }, 200);
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
        this.applyOrdersResponse(res, { openReviewForOrderId });
        this.loading = false;
        this.spinnerService.hide();
      },
      error: () => {
        this.loading = false;
        this.spinnerService.hide();
      },
    });
  }

  private refreshOrdersSilently(): void {
    this.orderService.getMyOrders(this.currentPage, this.itemsPerPage).subscribe({
      next: (res: any) => {
        this.applyOrdersResponse(res);
      },
    });
  }

  private applyOrdersResponse(
    res: any,
    options: { openReviewForOrderId?: string } = {},
  ): void {
    const newOrders = res.orders || [];
    this.orders = newOrders;
    this.totalItems = res.pagination?.totalItems || 0;
    this.itemsPerPage = res.pagination?.pageSize || this.itemsPerPage;
    this.currentPage = res.pagination?.currentPage || this.currentPage;

    newOrders.forEach((order: any) => {
      if (!this.previousStatuses.has(order._id)) {
        this.previousStatuses.set(order._id, order.status);
        if (order.status === 'delivered') {
          this.highlightOrder(order._id, 8000);
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
      if (this.canWriteReview(order)) {
        this.reviewOrder(order);
      }
    }
  }

  private startReviewModalTimer(seconds = 30): void {
    this.clearReviewModalTimer();
    this.reviewModalSecondsLeft = seconds;

    this.reviewModalTimer = setInterval(() => {
      this.reviewModalSecondsLeft -= 1;
      if (this.reviewModalSecondsLeft <= 0) {
        this.clearReviewModalTimer();
      }
    }, 1000);
  }

  private clearReviewModalTimer(): void {
    if (this.reviewModalTimer) {
      clearInterval(this.reviewModalTimer);
      this.reviewModalTimer = null;
    }
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
    if (!this.canFileClaim(order)) return '';
    const days = order.claimDaysRemaining ?? 0;
    if (days <= 0) return 'Claim window expired';
    if (days === 1) return '1 day left to file a claim';
    return `${days} days left to file a claim`;
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
    const rating = Number(this.reviewForm.value.rating) || 0;
    const comment = this.reviewForm.value.comment || '';

    if (rating < 0.5) {
      this.skipReview();
      return;
    }

    if (!this.selectedOrder) return;

    this.reviewSubmitting = true;
    this.orderService.submitReview(this.selectedOrder._id, { rating, comment }).subscribe({
      next: () => {
        this.reviewSubmitting = false;
        this.scheduleReviewReveal(this.selectedOrder._id, { rating, comment });
        this.reviewModalClosing = true;

        setTimeout(() => {
          this.reviewModal = false;
          this.reviewModalClosing = false;
          this.selectedOrder = null;
          this.clearReviewModalTimer();
          this.loadOrders();
        }, 250);
      },
      error: () => {
        this.reviewSubmitting = false;
      },
    });
  }

  private scheduleReviewReveal(
    orderId: string,
    review: { rating: number; comment?: string },
  ): void {
    this.pendingReviewReveal = { orderId, review };
    if (this.reviewRevealTimer) clearTimeout(this.reviewRevealTimer);

    this.reviewRevealTimer = setTimeout(() => {
      this.flushPendingReviewReveal();
    }, 30000);
  }

  private flushPendingReviewReveal(): void {
    if (!this.pendingReviewReveal) return;

    const { orderId, review } = this.pendingReviewReveal;
    this.pendingReviewReveal = null;
    this.revealReviewOnCard(orderId, review);
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
    }

    this.reviewRevealOrderIds.add(orderId);
    this.expandedOrderIds.add(orderId);
    this.highlightOrder(orderId, 30000);
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
