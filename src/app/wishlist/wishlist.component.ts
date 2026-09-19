import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WishlistService } from '../services/wishlist.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { ProductGridLayoutService } from '../shared/product-grid-layout.service';
import { HeaderProductSearchService } from '../core/services/header-product-search.service';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
  standalone: true,
  imports: [
    MatPaginatorModule,
    NgFor,
    ProductCardComponent,
    NgIf,
    NgClass,
    MatIconModule,
  ],
})
export class WishlistComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly headerSearch = inject(HeaderProductSearchService);

  products: any[] = [];
  totalItems = 0;
  itemsPerPage = 0;
  currentPage = 1;
  sortOrder: 'low' | 'high' | '' = '';
  searchQuery = '';
  isLoading = false;

  constructor(
    private wishlistService: WishlistService,
    public gridLayout: ProductGridLayoutService,
  ) {}

  ngOnInit(): void {
    this.gridLayout.syncViewport();
    this.searchQuery = this.headerSearch.getQuery('wishlist');
    this.headerSearch.bindPageSearch(this.destroyRef, 'wishlist', (query) => {
      if (this.searchQuery === query) return;
      this.searchQuery = query;
      this.currentPage = 1;
      this.loadWishlist();
    });
    this.loadWishlist();
  }

  loadWishlist() {
    this.isLoading = true;

    this.wishlistService
      .getWishlist({
        page: this.currentPage,
        sort: this.sortOrder,
        search: this.searchQuery,
      })
      .subscribe({
        next: (res: any) => {
          this.products = res.products;
          this.totalItems = res.pagination.totalItems;
          this.itemsPerPage = res.pagination.itemsPerPage;
          this.currentPage = res.pagination.currentPage;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading wishlist:', err);
          this.isLoading = false;
        },
      });
  }

  pageChanged(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.loadWishlist();
  }

  setSort(order: 'low' | 'high' | '') {
    this.sortOrder = order;
    this.currentPage = 1;
    this.loadWishlist();
  }

  cycleGridLayout(): void {
    this.gridLayout.cycleGridLayout();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.gridLayout.syncViewport();
  }
}
