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
import { SeoService } from '../services/seo';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductGridLayoutService } from '../shared/product-grid-layout.service';
import { ChatService } from '../services/chat.service';
import { ToastrService } from 'ngx-toastr';

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
    RouterLink,
  ],
  templateUrl: './seller-profile.component.html',
  styleUrls: ['./seller-profile.component.css'],
})
export class SellerProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private chat = inject(ChatService);
  private toastr = inject(ToastrService);
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
  itemsPerPage = 0;
  currentPage = 1;
  noProducts = false;

  ngOnInit(): void {
    this.gridLayout.syncViewport();
    const sellerId = this.route.snapshot.paramMap.get('id');
    if (!sellerId) {
      this.loading = false;
      return;
    }

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
      },
      error: () => {
        this.loading = false;
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
      .getProductsBySeller(
        sellerId,
        this.currentPage,
        this.itemsPerPage > 0 ? this.itemsPerPage : undefined,
        this.productSearch,
      )
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

  messageSeller(): void {
    const sellerId = this.user?._id;
    if (!sellerId) return;

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/signin'], {
        queryParams: { returnUrl: `/profile/${sellerId}` },
      });
      return;
    }

    this.chat.startWithSeller(sellerId).subscribe({
      next: (conversation) => {
        this.router.navigate(['/messages', conversation._id]);
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Could not start chat');
      },
    });
  }
}
