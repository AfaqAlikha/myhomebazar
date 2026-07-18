import { Component, Input, inject, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, NgIf, NgForOf, isPlatformBrowser, DecimalPipe } from '@angular/common';
import { StarRatingComponent } from '../../star-rating/star-rating.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WishlistService } from '../../../services/wishlist.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../auth/auth.service';
import { isOwnProduct as checkOwnProduct } from '../../../utils/auth';

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
  ],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
})
export class ProductCardComponent implements OnInit {
  private router = inject(Router);

  @Input() product!: Product;

  currentUserId: string | null = null;
  wishlistLoading = false;
  cartLoading = false;

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private wishlistService: WishlistService,
    private cartService: CartService,
    private auth: AuthService,
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
