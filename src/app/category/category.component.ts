import { Component, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';

import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiSearchComponent } from '../shared/ui-search/ui-search.component';

import { ProductService } from '../services/product.service';
import { CategoryService, Category } from '../services/category.service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    NgFor,
    MatPaginatorModule,
    ProductCardComponent,
    UiCardComponent,
    UiSearchComponent,
    NgClass,
    NgIf,
    NgxSpinnerModule,
  ],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
})
export class CategoryComponent implements OnInit {
  borderRadius = '10px';
  isLoading = false;
  noProducts = false;

  categories: Category[] = [];
  subCategories: any[] = [];

  products: any[] = [];
  totalItems = 0;
  itemsPerPage = 0;
  currentPage = 1; // backend is 1-based

  sortOrder: 'low' | 'high' | '' = '';
  selectedCategoryName = '';
  selectedCategoryId = '';
  selectedSubCategory = '';
  searchQuery = '';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    // Load all categories
    this.categoryService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) => console.error('Error loading categories', err),
    });

    // Listen to route params
    this.route.params.subscribe((params) => {
      this.selectedCategoryName = params['slug'];
      this.selectedCategoryId = params['id'];

      // Reset filters
      this.selectedSubCategory = '';
      this.searchQuery = '';
      this.sortOrder = '';
      this.currentPage = 1;

      this.fetchProducts();

      // Load subcategories
      this.categoryService.getSubCategories(this.selectedCategoryId).subscribe({
        next: (subs) => (this.subCategories = subs),
        error: (err) => console.error('Error loading subcategories', err),
      });
    });
  }

  // Fetch products with filters
  fetchProducts() {
    this.isLoading = true;
    this.noProducts = false;
    this.spinner.show();

    this.productService
      .getProducts({
        catName: this.selectedCategoryName,
        subCatName: this.selectedSubCategory,
        page: this.currentPage,
        limit: this.itemsPerPage > 0 ? this.itemsPerPage : 6,
        sort: this.sortOrder,
        search: this.searchQuery,
      })
      .subscribe({
        next: (res) => {
          this.products = res.products;

          // ✅ use backend pagination response
          this.totalItems = res.pagination.totalItems;
          this.itemsPerPage = res.pagination.itemsPerPage;
          this.currentPage = res.pagination.currentPage;

          this.noProducts = this.products.length === 0;
          this.isLoading = false;
          this.spinner.hide();
        },
        error: (err) => {
          console.error('Error fetching products', err);
          this.isLoading = false;
          this.noProducts = true;
          this.spinner.hide();
        },
      });
  }

  // Search handler
  onSearch(query: string) {
    this.searchQuery = query;
    this.currentPage = 1;
    this.fetchProducts();
  }

  // Subcategory filter
  selectSubCategory(sub: string) {
    this.selectedSubCategory = sub;
    this.currentPage = 1;
    this.fetchProducts();
  }

  showAllProducts() {
    this.selectedSubCategory = '';
    this.currentPage = 1;
    this.fetchProducts();
  }

  // Sorting
  setSort(order: 'low' | 'high') {
    this.sortOrder = order;
    this.currentPage = 1;
    this.fetchProducts();
  }

  // Pagination
  pageChanged(event: PageEvent) {
    // Angular Material pageIndex is 0-based, backend expects 1-based
    this.currentPage = event.pageIndex + 1;
    this.fetchProducts();
  }
}
