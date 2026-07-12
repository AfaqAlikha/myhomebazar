import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SpinnerService } from '../../shared/spinner.service';
import { RatingModule } from 'primeng/rating';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductOrderService } from '../../services/product-order.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    RatingModule,
    UiCardComponent,
    UiButtonComponent,
    MatPaginatorModule,
  ],
  templateUrl: './order-history.html',
  styleUrls: ['./order-history.css'],
})
export class OrderHistoryComponent implements OnInit {
  orders: any[] = [];

  totalItems = 0;
  itemsPerPage = 10;
  currentPage = 1;
  loading = false;
  reviewModal = false;
  selectedOrder: any = null;
  reviewForm!: FormGroup;
  cancelModal = false;
  selectedCancelOrder: any = null;

  cancelForm!: FormGroup;
  constructor(
    private orderService: ProductOrderService,
    private fb: FormBuilder,
    private spinnerService: SpinnerService,
  ) {}

  ngOnInit(): void {
    this.reviewForm = this.fb.group({
      rating: [0, Validators.required],
      comment: ['', Validators.required],
    });
    this.cancelForm = this.fb.group({
      cancelReason: ['', Validators.required],
    });

    this.loadOrders();
  }
  closeReviewModal() {
    this.reviewModal = false;
  }
  // loadOrders() {
  //   this.loading = true;
  //   this.spinnerService.show();

  //   this.orderService.getMyOrders().subscribe({
  //     next: (res: any) => {
  //       this.orders = res.orders || [];
  //       this.loading = false;
  //       this.spinnerService.hide();
  //     },
  //     error: () => {
  //       this.loading = false;
  //       this.spinnerService.hide();
  //     },
  //   });
  // }

  pageChanged(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;

    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.spinnerService.show();

    this.orderService.getMyOrders(this.currentPage, this.itemsPerPage).subscribe({
      next: (res: any) => {
        this.orders = res.orders || [];

        this.totalItems = res.pagination.totalItems;
        this.itemsPerPage = res.pagination.pageSize;
        this.currentPage = res.pagination.currentPage;

        this.loading = false;
        this.spinnerService.hide();
      },
      error: () => {
        this.loading = false;
        this.spinnerService.hide();
      },
    });
  }
  cancelOrder(order: any) {
    this.selectedCancelOrder = order;

    this.cancelForm.reset({
      cancelReason: '',
    });

    this.cancelModal = true;
  }

  closeCancelModal() {
    this.cancelModal = false;
  }

  completeOrder(order: any) {
    this.spinnerService.show();

    this.orderService
      .updateOrderStatus(order._id, {
        status: 'completed',
      })
      .subscribe({
        next: () => {
          this.loadOrders();
        },
        error: () => {
          this.spinnerService.hide();
        },
      });
  }

  reviewOrder(order: any) {
    this.selectedOrder = order;

    this.reviewForm.reset({
      rating: 0,
      comment: '',
    });

    this.reviewModal = true;
  }
  submitCancelOrder() {
    if (this.cancelForm.invalid) {
      this.cancelForm.markAllAsTouched();
      return;
    }

    this.spinnerService.show();

    this.orderService
      .updateOrderStatus(this.selectedCancelOrder._id, {
        status: 'cancelled',
        cancelReason: this.cancelForm.value.cancelReason,
      })
      .subscribe({
        next: () => {
          this.cancelModal = false;
          this.loadOrders();
        },
        error: () => {
          this.spinnerService.hide();
        },
      });
  }
  submitReview() {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const { rating, comment } = this.reviewForm.value;

    this.spinnerService.show();

    this.orderService
      .updateOrderStatus(this.selectedOrder._id, {
        status: 'completed',
        rating,
        comment,
      })
      .subscribe({
        next: () => {
          this.reviewModal = false;
          this.loadOrders();
        },
        error: () => {
          this.spinnerService.hide();
        },
      });
  }
}
