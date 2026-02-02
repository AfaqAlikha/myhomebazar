import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../services/wishlist.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { UiSearchComponent } from '../shared/ui-search/ui-search.component';
import { SpinnerService } from '../shared/spinner.service';
@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
  standalone: true,
  imports: [
    MatPaginatorModule,
    NgFor,
    ProductCardComponent,
    UiSearchComponent,
    NgIf,
    NgClass
  ],
})
export class WishlistComponent implements OnInit {
  products: any[] = [];
  totalItems: number = 0;
  itemsPerPage: number = 0; // backend से आएगा
  currentPage: number = 1; // backend 1-based page index
  sortOrder: 'low' | 'high' | '' = '';
  searchQuery: string = '';
  isLoading = false;
  constructor(
    private wishlistService: WishlistService,
    private spinner: SpinnerService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist() {
    this.isLoading = true;
    this.spinner.show();

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
          this.spinner.hide();
        },
        error: (err) => {
          console.error('Error loading wishlist:', err);
          this.isLoading = false;
          this.spinner.hide();
        },
      });
  }

  pageChanged(event: PageEvent) {
    this.currentPage = event.pageIndex + 1; // paginator 0-based होता है
    this.loadWishlist();
  }

  // ✅ Search handler
  onSearch(query: string) {
    this.searchQuery = query;
    this.currentPage = 1;
    this.loadWishlist();
  }

  // ✅ Sorting handler
  setSort(order: 'low' | 'high') {
    this.sortOrder = order;
    this.currentPage = 1;
    this.loadWishlist();
  }
}
