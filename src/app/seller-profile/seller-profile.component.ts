import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { AuthService } from '../auth/auth.service';
import { ProductService } from '../services/product.service';
import { SpinnerService } from '../shared/spinner.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ProductCardComponent,
    CommonModule,
    NgFor,
    NgIf,
    MatPaginatorModule,
    NgxSpinnerModule,
  ],
  templateUrl: './seller-profile.component.html',
  styleUrls: ['./seller-profile.component.css'],
})
export class SellerProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private productService = inject(ProductService);
  private spinnerService = inject(SpinnerService);
  private ngxSpinner = inject(NgxSpinnerService);
  private route = inject(ActivatedRoute);

  form: FormGroup = this.fb.group({
    name: [''],
    email: [''],
    bio: [''],
  });

  user: any;
  loading = false;

  // Products
  products: any[] = [];
  totalItems = 0;
  itemsPerPage = 6;
  currentPage = 1;
  noProducts = false;

  ngOnInit() {
    this.loading = true;
    this.spinnerService.show();

    // Get seller ID from URL
    const sellerId = this.route.snapshot.paramMap.get('id');
    if (!sellerId) {
      console.error('Seller ID not found in route');
      this.loading = false;
      this.spinnerService.hide();
      return;
    }

    // Fetch public profile
    this.auth.getPublicProfile(sellerId).subscribe({
      next: (res) => {
        this.user = res;

        this.form.patchValue({
          name: this.user.name || '',
          email: this.user.email || '',
          bio: this.user.bio || '',
        });

        this.fetchProducts(sellerId);

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

  fetchProducts(sellerId: string) {
    this.ngxSpinner.show();
    this.productService
      .getProductsBySeller(sellerId, this.currentPage, this.itemsPerPage)
      .subscribe({
        next: (res) => {
          this.products = res.products;
          this.totalItems = res.pagination.totalItems;
          this.itemsPerPage = res.pagination.itemsPerPage;
          this.currentPage = res.pagination.currentPage;
          this.noProducts = this.products.length === 0;
          this.ngxSpinner.hide();
        },
        error: (err) => {
          console.error(err);
          this.noProducts = true;
          this.ngxSpinner.hide();
        },
      });
  }

  pageChanged(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    const sellerId = this.user?._id;
    if (sellerId) this.fetchProducts(sellerId);
  }

  // 🔹 Replace with actual route param fetching logic
  private getSellerIdFromRoute(): string {
    // Example: fetch from ActivatedRoute
    return 'SELLER_ID_HERE';
  }
}
