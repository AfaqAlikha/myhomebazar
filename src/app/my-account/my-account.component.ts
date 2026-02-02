import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { UiSearchComponent } from '../shared/ui-search/ui-search.component';

import { AuthService } from '../auth/auth.service';
import { ProductService } from '../services/product.service';
import { CategoryService, Category } from '../services/category.service';
import { Router } from '@angular/router';
import { SpinnerService } from '../shared/spinner.service';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [
    ReactiveFormsModule,

    ProductCardComponent,
    UiSearchComponent,
    CommonModule,
    NgFor,
    NgIf,
    MatPaginatorModule,
    NgxSpinnerModule,
  ],
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.css'],
})
export class MyAccountComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private spinnerService = inject(SpinnerService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private ngxSpinner = inject(NgxSpinnerService);

  borderRadius = '8px';
  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: [{ value: '', disabled: true }],
    bio: [''],
  });
  user: any;
  loading = false;

  // Products
  products: any[] = [];
  totalItems = 0;
  itemsPerPage = 6;
  currentPage = 1;
  searchQuery = '';
  sortOrder: 'low' | 'high' | '' = '';
  categories: Category[] = [];
  subCategories: any[] = [];
  selectedCategoryId = '';
  selectedCategoryName = '';
  selectedSubCategory = '';
  noProducts = false;
  showProductsSection = false;

  ngOnInit() {
    this.loading = true;
    this.spinnerService.show();

    this.auth.getMyProfile().subscribe({
      next: (res) => {
        // res IS the user object, not res.user
        if (!res) {
          console.error('User data is missing', res);
          this.loading = false;
          this.spinnerService.hide();
          return;
        }

        this.user = res;

        // Patch form safely
        this.form.patchValue({
          name: this.user.name || '',
          email: this.user.email || '',
          bio: this.user.bio || '',
        });

        // Show products section for seller/admin/superadmin
        this.showProductsSection = ['seller', 'admin', 'superadmin'].includes(
          this.user.role
        );

        if (this.showProductsSection) {
          this.loadCategories();
          this.fetchProducts();
        }

        this.loading = false;
        this.spinnerService.hide();
      },
      error: (err) => {
        console.error('Error fetching profile', err);
        this.loading = false;
        this.spinnerService.hide();
      },
    });
  }

  getInitial(name: string) {
    return name ? name.charAt(0).toUpperCase() : '';
  }

  /** Profile Update */
  submit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.spinnerService.show();
    this.auth.updateProfile(this.user._id, this.form.value).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.spinnerService.hide();
      },
      error: () => {
        this.loading = false;
        this.spinnerService.hide();
      },
    });
  }

  /** PRODUCTS SECTION METHODS */

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) => console.error(err),
    });
  }

  fetchProducts() {
    const params = {
      catName: this.selectedCategoryName,
      subCatName: this.selectedSubCategory,
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort: this.sortOrder,
      search: this.searchQuery,
    };

    this.ngxSpinner.show();
    this.productService
      .getMyProducts({
        page: this.currentPage,
        limit: this.itemsPerPage,
        catName: this.selectedCategoryName,
        subCatName: this.selectedSubCategory,
        sort: this.sortOrder,
        search: this.searchQuery,
      })
      .subscribe({
        next: (res) => {
          this.products = res.products;
          this.totalItems = res.pagination.totalItems;
          this.itemsPerPage = res.pagination.itemsPerPage;
          this.currentPage = res.pagination.currentPage;
          this.noProducts = this.products.length === 0;
        },
        error: (err) => {
          console.error(err);
          this.noProducts = true;
        },
      });
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.currentPage = 1;
    this.fetchProducts();
  }

  selectCategory(cat: Category) {
    this.selectedCategoryId = cat._id;
    this.selectedCategoryName = cat.name;
    this.selectedSubCategory = '';
    this.currentPage = 1;

    this.categoryService.getSubCategories(cat._id).subscribe({
      next: (subs) => (this.subCategories = subs),
      error: (err) => console.error(err),
    });

    this.fetchProducts();
  }

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

  setSort(order: 'low' | 'high') {
    this.sortOrder = order;
    this.currentPage = 1;
    this.fetchProducts();
  }

  pageChanged(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.fetchProducts();
  }
}
