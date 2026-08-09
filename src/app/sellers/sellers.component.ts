import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { UiSearchComponent } from '../shared/ui-search/ui-search.component';
import {
  LocationFilterComponent,
  LocationFilters,
} from '../shared/location-filter/location-filter.component';
import { SellerService, SellerProfile } from '../services/seller.service';
import { SpinnerService } from '../shared/spinner.service';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { StarRatingComponent } from '../shared/star-rating/star-rating.component';
import { UserAvatarComponent } from '../shared/user-avatar/user-avatar.component';
import { SeoService } from '../services/seo';

@Component({
  selector: 'app-sellers',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatPaginatorModule,
    MatIconModule,
    UiSearchComponent,
    LocationFilterComponent,
    UiCardComponent,
    StarRatingComponent,
    UserAvatarComponent,
  ],
  templateUrl: './sellers.component.html',
  styleUrls: ['./sellers.component.css'],
})
export class SellersComponent implements OnInit {
  sellers: SellerProfile[] = [];
  loading = false;
  searchQuery = '';
  locationFilters: LocationFilters = { country: '', state: '', city: '' };
  copiedSellerId: string | null = null;

  totalItems = 0;
  itemsPerPage = 12;
  currentPage = 1;

  private readonly isBrowser: boolean;

  constructor(
    private sellerService: SellerService,
    private spinnerService: SpinnerService,
    private seo: SeoService,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.setDefaultSeo();
    this.loadSellers();
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.currentPage = 1;
    this.loadSellers();
  }

  onLocationFilter(filters: LocationFilters): void {
    this.locationFilters = filters;
    this.currentPage = 1;
    this.loadSellers();
  }

  loadSellers(): void {
    this.loading = true;
    this.spinnerService.show();

    this.sellerService
      .getSellers({
        page: this.currentPage,
        limit: this.itemsPerPage,
        search: this.searchQuery,
        country: this.locationFilters.country,
        state: this.locationFilters.state,
        city: this.locationFilters.city,
      })
      .subscribe({
        next: (res) => {
          this.sellers = res.sellers;
          this.totalItems = res.pagination.totalItems || 0;
          this.itemsPerPage = res.pagination.pageSize || this.itemsPerPage;
          this.currentPage = res.pagination.currentPage || this.currentPage;
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
    this.loadSellers();
  }

  getSellerShareUrl(sellerId: string): string {
    if (!this.isBrowser || !sellerId) return '';
    return `${window.location.origin}/profile/${sellerId}`;
  }

  canNativeShare(): boolean {
    return this.isBrowser && typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }

  async copySellerLink(event: Event, seller: SellerProfile): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const url = this.getSellerShareUrl(seller._id);
    if (!url) return;

    const copied = await this.copyTextToClipboard(url);
    if (copied) {
      this.copiedSellerId = seller._id;
      this.toastr.success('Seller profile link copied');
      window.setTimeout(() => {
        if (this.copiedSellerId === seller._id) {
          this.copiedSellerId = null;
        }
      }, 2000);
      return;
    }

    this.toastr.error('Could not copy link');
  }

  async shareSeller(event: Event, seller: SellerProfile): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const url = this.getSellerShareUrl(seller._id);
    if (!url) return;

    if (this.canNativeShare()) {
      try {
        await navigator.share({
          title: `${seller.name} Store`,
          text: `Check out ${seller.name} on MyHomeBazar`,
          url,
        });
        return;
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
      }
    }

    await this.copySellerLink(event, seller);
  }

  getLocation(seller: SellerProfile): string {
    return [seller.city, seller.state, seller.country].filter(Boolean).join(', ');
  }

  private async copyTextToClipboard(text: string): Promise<boolean> {
    if (!this.isBrowser) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fallback below */
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }
}
