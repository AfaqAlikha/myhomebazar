import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StarRatingComponent } from '../shared/star-rating/star-rating.component';
import { UserAvatarComponent } from '../shared/user-avatar/user-avatar.component';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { HeaderProductSearchService } from '../core/services/header-product-search.service';

import { AuthService } from '../auth/auth.service';
import { ProductService } from '../services/product.service';
import { CategoryService, Category } from '../services/category.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ProductCardComponent,
    StarRatingComponent,
    UserAvatarComponent,
    CommonModule,
    NgFor,
    NgIf,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.css'],
})
export class MyAccountComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);
  private headerSearch = inject(HeaderProductSearchService);

  borderRadius = '8px';
  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: [{ value: '', disabled: true }],
    bio: [''],
  });
  user: any;
  loading = false;
  submitting = false;
  productsLoading = false;

  products: any[] = [];
  totalItems = 0;
  itemsPerPage = 0;
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

    this.auth.getMyProfile().subscribe({
      next: (res) => {
        if (!res) {
          console.error('User data is missing', res);
          this.loading = false;
          return;
        }

        this.user = res;

        this.form.patchValue({
          name: this.user.name || '',
          email: this.user.email || '',
          bio: this.user.bio || '',
        });

        this.showProductsSection = ['seller', 'admin', 'superadmin'].includes(
          this.user.role,
        );

        if (this.showProductsSection) {
          this.searchQuery = this.headerSearch.getQuery('my-account');
          this.headerSearch.bindPageSearch(this.destroyRef, 'my-account', (query) => {
            if (this.searchQuery === query) return;
            this.searchQuery = query;
            this.currentPage = 1;
            this.fetchProducts();
          });
          this.loadCategories();
          this.fetchProducts();
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching profile', err);
        this.loading = false;
      },
    });
  }

  getInitial(name: string) {
    return name ? name.charAt(0).toUpperCase() : '';
  }

  submit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.auth.updateProfile(this.user._id, this.form.value).subscribe({
      next: (user) => {
        this.user = user;
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
      },
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) => console.error(err),
    });
  }

  fetchProducts() {
    this.productsLoading = true;
    this.productService
      .getMyProducts({
        page: this.currentPage,
        ...(this.itemsPerPage > 0 ? { limit: this.itemsPerPage } : {}),
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
          this.productsLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.noProducts = true;
          this.productsLoading = false;
        },
      });
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
