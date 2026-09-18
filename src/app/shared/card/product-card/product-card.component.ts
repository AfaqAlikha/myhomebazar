import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  inject,
  Inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, NgIf, isPlatformBrowser, DecimalPipe } from '@angular/common';
import { StarRatingComponent } from '../../star-rating/star-rating.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WishlistService } from '../../../services/wishlist.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../auth/auth.service';
import { ProductService } from '../../../services/product.service';
import { isOwnProduct as checkOwnProduct } from '../../../utils/auth';
import { addProductToGuestCart } from '../../../services/guest-cart.service';
import { ToastrService } from 'ngx-toastr';
import { ScrollRevealDirective } from '../../scroll-reveal/scroll-reveal.directive';

interface Product {
  _id: string;
  user: string | { _id?: string; id?: string };
  name: string;
  description: string;
  images: string[];
  price: number;
  averageRating: number;
  isPromoted?: boolean;
  promotionExpiresAt?: string | Date | null;
  promotionLabel?: string;
  promotionType?: string;
  promotionDealText?: string;
  viewCount?: number;
  likeCount?: number;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    NgIf,
    StarRatingComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DecimalPipe,
    ScrollRevealDirective,
  ],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
})
export class ProductCardComponent implements OnInit, OnDestroy {
  private static readonly NAV_LOADER_MIN_MS = 250;

  private router = inject(Router);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  @Input() product!: Product;
  @Input() revealDelay = 0;

  currentUserId: string | null = null;
  wishlistLoading = false;
  cartLoading = false;
  navigating = false;

  private isBrowser: boolean;
  private isScrolling = false;
  private scrollResetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private wishlistService: WishlistService,
    private cartService: CartService,
    private auth: AuthService,
    private toastr: ToastrService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.currentUserId = this.auth.getUser()?.id ?? null;
    }
  }

  isOwnProduct(): boolean {
    return checkOwnProduct(this.product, this.currentUserId);
  }

  isPromotionActive(): boolean {
    if (!this.product?.isPromoted) return false;
    if (!this.product.promotionExpiresAt) return this.product.isPromoted;
    return new Date(this.product.promotionExpiresAt).getTime() > Date.now();
  }

  getPromotionBadge(): string {
    if (!this.isPromotionActive()) return '';
    return this.product.promotionLabel?.trim() || 'Deal';
  }

  formatEngagementCount(value?: number): string {
    const count = Number(value) || 0;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isBrowser) return;
    this.isScrolling = true;
    if (this.scrollResetTimer) clearTimeout(this.scrollResetTimer);
    this.scrollResetTimer = setTimeout(() => {
      this.isScrolling = false;
      this.scrollResetTimer = null;
    }, 180);
  }

  ngOnDestroy(): void {
    if (this.scrollResetTimer) clearTimeout(this.scrollResetTimer);
  }

  prefetchDetails(): void {
    if (this.isScrolling) return;
    this.productService.prefetchProductById(this.product._id);
  }

  openDetails(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.navigating) return;

    const startedAt = Date.now();
    this.navigating = true;
    this.cdr.detectChanges();

    this.router.navigate(['/product/details', this.product._id]).finally(() => {
      const remaining = Math.max(
        0,
        ProductCardComponent.NAV_LOADER_MIN_MS - (Date.now() - startedAt),
      );

      setTimeout(() => {
        this.navigating = false;
        this.cdr.markForCheck();
      }, remaining);
    });
  }

  onWishlistClick(event: Event, productId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToWishlist(productId);
  }

  onCartClick(event: Event, product: Product): void {
    event.preventDefault();
    event.stopPropagation();
    this.addToCart(product);
  }

  addToWishlist(productId: string): void {
    if (this.isOwnProduct()) return;
    this.wishlistLoading = true;
    this.wishlistService.addToWishlist(productId).subscribe({
      next: () => {
        this.wishlistLoading = false;
        this.router.navigate(['/wishlist']);
      },
      error: () => {
        this.wishlistLoading = false;
      },
    });
  }

  addToCart(product: Product): void {
    if (this.isOwnProduct()) return;

    if (!this.auth.isLoggedIn()) {
      addProductToGuestCart(
        {
          _id: product._id,
          name: product.name,
          images: product.images,
          price: product.price,
          weightKg: (product as any).weightKg,
          user: product.user,
        },
        1,
      );
      this.toastr.success('Added to cart');
      this.router.navigate(['/cart']);
      return;
    }

    this.cartLoading = true;
    this.cartService.addToCart(product._id).subscribe({
      next: () => {
        this.cartLoading = false;
        this.router.navigate(['/cart']);
      },
      error: () => {
        this.cartLoading = false;
      },
    });
  }
}
