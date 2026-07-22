import { Component, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiSearchComponent } from '../shared/ui-search/ui-search.component';

import { ProductService } from '../services/product.service';
import { CategoryService, Category } from '../services/category.service';
import { SeoService } from '../services/seo';
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
  childSubCategories: any[] = [];

  selectedChildSubCategories: string[] = [];
  products: any[] = [];
  totalItems = 0;
  itemsPerPage = 0;
  currentPage = 1; // backend is 1-based
  selectedSubCategoryId = '';
  sortOrder: 'low' | 'high' | '' = '';
  selectedCategoryId = '';
  selectedCategoryName = '';
  selectedSubCategory = '';
  searchQuery = '';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private spinner: NgxSpinnerService,
    private seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.seo.setShopSeo();
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
        category: this.selectedCategoryId,

        subCategory: this.selectedSubCategoryId,

        childSubCategory: this.selectedChildSubCategories.join(','),
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

  selectCategory(cat: Category) {
    // Agar same category dobara click ho to deselect
    if (this.selectedCategoryId === cat._id) {
      this.showAllProducts();
      return;
    }

    this.selectedCategoryId = cat._id;
    this.selectedCategoryName = cat.name;

    this.selectedSubCategoryId = '';
    this.selectedSubCategory = '';

    this.subCategories = [];
    this.childSubCategories = [];
    this.selectedChildSubCategories = [];

    this.currentPage = 1;

    this.categoryService.getSubCategories(cat._id).subscribe({
      next: (subs) => {
        this.subCategories = subs;
      },
    });

    this.fetchProducts();
  }
  selectSubCategory(sub?: any) {
    // All par click ya deselect
    if (!sub) {
      this.selectedSubCategoryId = '';
      this.selectedSubCategory = '';
      this.childSubCategories = [];
      this.selectedChildSubCategories = [];
      this.currentPage = 1;
      this.fetchProducts();
      return;
    }

    // Same subcategory dobara click
    if (this.selectedSubCategoryId === sub._id) {
      this.selectedSubCategoryId = '';
      this.selectedSubCategory = '';
      this.childSubCategories = [];
      this.selectedChildSubCategories = [];
      this.currentPage = 1;
      this.fetchProducts();
      return;
    }

    this.selectedSubCategoryId = sub._id;
    this.selectedSubCategory = sub.subCategory;
    this.selectedChildSubCategories = [];

    this.currentPage = 1;

    this.categoryService.getChildSubCategories(sub._id).subscribe({
      next: (res) => {
        this.childSubCategories = res;
      },
    });

    this.fetchProducts();
  }

  toggleChildSubCategory(id: string) {
    const index = this.selectedChildSubCategories.indexOf(id);

    if (index > -1) {
      this.selectedChildSubCategories.splice(index, 1);
    } else {
      this.selectedChildSubCategories.push(id);
    }

    this.currentPage = 1;
    this.fetchProducts();
  }

  // showAllProducts() {
  //   this.selectedCategoryId = '';
  //   this.selectedCategoryName = '';
  //   this.selectedSubCategory = '';
  //   this.currentPage = 1;
  //   this.fetchProducts();
  // }

  showAllProducts() {
    this.selectedCategoryId = '';

    this.selectedCategoryName = '';

    this.selectedSubCategoryId = '';

    this.selectedSubCategory = '';

    this.subCategories = [];

    this.childSubCategories = [];

    this.selectedChildSubCategories = [];

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
