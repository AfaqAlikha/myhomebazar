import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { UiSearchComponent } from '../shared/ui-search/ui-search.component';
import {
  LocationFilterComponent,
  LocationFilters,
} from '../shared/location-filter/location-filter.component';
import { SellerService, SellerProfile } from '../services/seller.service';
import { SpinnerService } from '../shared/spinner.service';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { StarRatingComponent } from '../shared/star-rating/star-rating.component';
import { SeoService } from '../services/seo';

@Component({
  selector: 'app-sellers',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatPaginatorModule,
    UiSearchComponent,
    LocationFilterComponent,
    UiCardComponent,
    StarRatingComponent,
  ],
  templateUrl: './sellers.component.html',
  styleUrls: ['./sellers.component.css'],
})
export class SellersComponent implements OnInit {
  sellers: SellerProfile[] = [];
  loading = false;
  searchQuery = '';
  locationFilters: LocationFilters = { country: '', state: '', city: '' };

  totalItems = 0;
  itemsPerPage = 12;
  currentPage = 1;

  constructor(
    private sellerService: SellerService,
    private spinnerService: SpinnerService,
    private seo: SeoService,
  ) {}

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

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getLocation(seller: SellerProfile): string {
    return [seller.city, seller.state, seller.country].filter(Boolean).join(', ');
  }
}
