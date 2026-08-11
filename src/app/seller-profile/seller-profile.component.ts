import { Component, HostListener, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { StarRatingComponent } from '../shared/star-rating/star-rating.component';
import { UserAvatarComponent } from '../shared/user-avatar/user-avatar.component';
import { UiSearchComponent } from '../shared/ui-search/ui-search.component';
import { AuthService } from '../auth/auth.service';
import { ProductService } from '../services/product.service';
import { SpinnerService } from '../shared/spinner.service';
import { SeoService } from '../services/seo';
import { ActivatedRoute } from '@angular/router';
import { ProductGridLayoutService } from '../shared/product-grid-layout.service';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ProductCardComponent,
    StarRatingComponent,
    UserAvatarComponent,
    UiSearchComponent,
    CommonModule,
    NgFor,
    NgIf,
    NgClass,
    MatPaginatorModule,
    MatIconModule,
  ],
  templateUrl: './seller-profile.component.html',
  styleUrls: ['./seller-profile.component.css'],
})
export class SellerProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private productService = inject(ProductService);
  private spinnerService = inject(SpinnerService);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  public gridLayout = inject(ProductGridLayoutService);

  form: FormGroup = this.fb.group({
    name: [''],
    email: [''],
    bio: [''],
  });

  user: any = null;
  loading = true;
  productsLoading = false;
  productSearch = '';

  products: any[] = [];
  totalItems = 0;
  itemsPerPage = 6;
  currentPage = 1;
  noProducts = false;

  ngOnInit(): void {
    this.gridLayout.syncViewport();
    const sellerId = this.route.snapshot.paramMap.get('id');
    if (!sellerId) {
      this.loading = false;
      return;
    }

    this.spinnerService.show();
    this.auth.getPublicProfile(sellerId).subscribe({
      next: (user) => {
        this.user = user;
        this.form.patchValue({
          name: this.user?.name || '',
          email: this.user?.email || '',
          bio: this.user?.bio || '',
        });
        this.seo.setSellerSeo(this.user.name, sellerId);
        this.fetchProducts(sellerId);
        this.loading = false;
        this.spinnerService.hide();
      },
      error: () => {
        this.loading = false;
        this.spinnerService.hide();
      },
    });
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '';
  }

  getLocation(): string {
    if (!this.user) return '';
    return [this.user.city, this.user.state, this.user.country].filter(Boolean).join(', ');
  }

  onProductSearch(query: string): void {
    this.productSearch = query;
    this.currentPage = 1;
    const sellerId = this.user?._id;
    if (sellerId) this.fetchProducts(sellerId);
  }

  fetchProducts(sellerId: string): void {
    this.productsLoading = true;
    this.productService
      .getProductsBySeller(sellerId, this.currentPage, this.itemsPerPage, this.productSearch)
      .subscribe({
        next: (res) => {
          this.products = res.products || [];
          this.totalItems = res.pagination?.totalItems || 0;
          this.itemsPerPage = res.pagination?.itemsPerPage || this.itemsPerPage;
          this.currentPage = res.pagination?.currentPage || this.currentPage;
          this.noProducts = this.products.length === 0;
          this.productsLoading = false;
        },
        error: () => {
          this.noProducts = true;
          this.productsLoading = false;
        },
      });
  }

  pageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    const sellerId = this.user?._id;
    if (sellerId) this.fetchProducts(sellerId);
  }

  cycleGridLayout(): void {
    this.gridLayout.cycleGridLayout();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.gridLayout.syncViewport();
  }
}
