import { Component, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiSearchComponent } from '../shared/ui-search/ui-search.component';

import { ProductService } from '../services/product.service';
import { CategoryService, Category } from '../services/category.service';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-shop',
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
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css'],
})
export class ShopComponent implements OnInit {
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
  selectedCategoryId = '';
  selectedCategoryName = '';
  selectedSubCategory = '';
  searchQuery = '';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    // ✅ Load all categories
    this.categoryService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) => console.error('Error loading categories', err),
    });

    this.fetchProducts();
  }

  // ✅ Fetch products with filters
  fetchProducts() {
    this.isLoading = true;
    this.noProducts = false;
    this.spinner.show();

    this.productService
      .getProducts({
        catName: this?.selectedCategoryName, // 👈 backend expects "catName"
        subCatName: this?.selectedSubCategory,
        page: this.currentPage,
        limit: this.itemsPerPage > 0 ? this.itemsPerPage : 6,
        sort: this.sortOrder,
        search: this.searchQuery,
      })
      .subscribe({
        next: (res) => {
          this.products = res.products;
          this.totalItems = res.pagination?.totalItems;
          this.itemsPerPage = res.pagination?.itemsPerPage;
          this.currentPage = res.pagination?.currentPage;

          this.noProducts = this.products?.length === 0;
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

  // ✅ Search handler
  onSearch(query: string) {
    this.searchQuery = query;
    this.currentPage = 1;
    this.fetchProducts();
  }

  // ✅ Category filter
  selectCategory(cat: Category) {
    this.selectedCategoryId = cat._id;

    // 👇 Backend ke liye catName use karna hoga (lekin Category model me "name" hai)
    this.selectedCategoryName = cat.name;

    this.selectedSubCategory = '';
    this.currentPage = 1;

    this.categoryService.getSubCategories(cat._id).subscribe({
      next: (subs) => (this.subCategories = subs),
      error: (err) => console.error('Error loading subcategories', err),
    });

    this.fetchProducts();
  }

  // ✅ Subcategory filter
  selectSubCategory(sub: string) {
    this.selectedSubCategory = sub;
    this.currentPage = 1;
    this.fetchProducts();
  }

  showAllProducts() {
    this.selectedCategoryId = '';
    this.selectedCategoryName = '';
    this.selectedSubCategory = '';
    this.currentPage = 1;
    this.fetchProducts();
  }

  // ✅ Sorting
  setSort(order: 'low' | 'high') {
    this.sortOrder = order;
    this.currentPage = 1;
    this.fetchProducts();
  }

  // ✅ Pagination
  pageChanged(event: PageEvent) {
    this.currentPage = event.pageIndex + 1; // Angular Material is 0-based
    this.fetchProducts();
  }
}
