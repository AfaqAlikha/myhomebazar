import { Component, HostListener, OnDestroy, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { StarRatingComponent } from '../shared/star-rating/star-rating.component';
import { UserAvatarComponent } from '../shared/user-avatar/user-avatar.component';
import { AuthService } from '../auth/auth.service';
import { HeaderProductSearchService } from '../core/services/header-product-search.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProductService } from '../services/product.service';
import { SeoService } from '../services/seo';
import { ActivatedRoute, Router } from '@angular/router';
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
export class SellerProfileComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private headerSearch = inject(HeaderProductSearchService);
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
  private searchScope = '';
  private searchSub?: Subscription;

  ngOnInit(): void {
    this.gridLayout.syncViewport();
    const sellerId = this.route.snapshot.paramMap.get('id');
    if (!sellerId) {
      this.loading = false;
      return;
    }

    this.searchScope = `profile:${sellerId}`;
    this.productSearch = this.headerSearch.getQuery(this.searchScope);
    this.bindHeaderSearch();

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

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  private bindHeaderSearch(): void {
    this.searchSub?.unsubscribe();
    this.searchSub = this.headerSearch
      .watch(this.searchScope)
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        if (this.productSearch === query) return;
        this.productSearch = query;
        this.currentPage = 1;
        const sellerId = this.user?._id;
        if (sellerId) this.fetchProducts(sellerId);
      });
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

  isOwnProfile(): boolean {
    const viewerId = this.auth.getUser()?.id;
    return !!viewerId && String(viewerId) === String(this.user?._id);
  }

  messageSeller(): void {
    const sellerId = this.user?._id;
    if (!sellerId) return;

    if (this.isOwnProfile()) {
      this.toastr.warning('You cannot message your own store');
      return;
    }

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
