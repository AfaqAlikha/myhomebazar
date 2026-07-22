import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ClaimsService } from '../../services/claims.service';
import { SpinnerService } from '../../shared/spinner.service';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { Claim, ClaimStatus } from '../../core/models/claim.model';
import { CLAIM_REASONS } from '../../core/config/api-endpoints';
import { GoogleAdComponent } from '../../shared/google-ad/google-ad.component';

@Component({
  selector: 'app-my-claims',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatPaginatorModule,
    UiCardComponent,
    UiButtonComponent,
    GoogleAdComponent,
  ],
  templateUrl: './my-claims.html',
  styleUrls: ['./my-claims.css'],
})
export class MyClaimsComponent implements OnInit {
  claims: Claim[] = [];
  loading = false;
  totalItems = 0;
  itemsPerPage = 10;
  currentPage = 1;
  statusFilter = '';

  selectedClaim: Claim | null = null;
  detailModal = false;

  readonly statusOptions: Array<{ value: string; label: string }> = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'resolved', label: 'Resolved' },
  ];

  constructor(
    private claimsService: ClaimsService,
    private spinnerService: SpinnerService,
  ) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.loading = true;
    this.spinnerService.show();

    this.claimsService
      .getClaims({
        page: this.currentPage,
        ...(this.statusFilter ? { status: this.statusFilter } : {}),
      })
      .subscribe({
        next: (res) => {
          this.claims = res.claims;
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

  pageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadClaims();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter = value;
    this.currentPage = 1;
    this.loadClaims();
  }

  openDetail(claim: Claim): void {
    this.selectedClaim = claim;
    this.detailModal = true;
  }

  closeDetail(): void {
    this.detailModal = false;
    this.selectedClaim = null;
  }

  getProductName(claim: Claim): string {
    if (typeof claim.product === 'object' && claim.product?.name) return claim.product.name;
    return 'Product';
  }

  getProductImage(claim: Claim): string | null {
    if (typeof claim.product === 'object' && claim.product?.images?.length) {
      return claim.product.images[0];
    }
    return null;
  }

  getOrderId(claim: Claim): string {
    if (typeof claim.order === 'object' && claim.order?._id) return claim.order._id;
    return String(claim.order);
  }

  getReasonLabel(reason: string): string {
    return CLAIM_REASONS.find((r) => r.value === reason)?.label || reason.replace(/_/g, ' ');
  }

  getStatusClass(status: ClaimStatus): string {
    const map: Record<ClaimStatus, string> = {
      pending: 'bg-yellow-500',
      under_review: 'bg-blue-500',
      approved: 'bg-green-600',
      rejected: 'bg-red-500',
      resolved: 'bg-gray-600',
    };
    return map[status] || 'bg-gray-500';
  }
}
