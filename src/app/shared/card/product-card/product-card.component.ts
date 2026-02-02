import { Component, Input, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WishlistService } from '../../../services/wishlist.service';
import { SpinnerService } from '../../spinner.service';
import { CartService } from '../../../services/cart.service';

interface Promotion {
  _id: string;
  startDate: string;
  endDate: string;
  planName: string;
  planType: string;
  usedProducts: number;
  totalProducts: number;
  discountPercent: number;
  buyQty: number;
  getQty: number;
}

interface Product {
  _id: string;
  user: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  discountPrice?: number;
  averageRating: number;
  activePromotions?: Promotion[];
  promotionFlag?: number;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterModule, CommonModule, NgIf, NgForOf, MatIconModule, MatButtonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
})
export class ProductCardComponent {
  private router = inject(Router);

  @Input() product!: Product;
  currentUser: any;

  constructor(
    private WishlistService: WishlistService,
    private spinner: SpinnerService,
    private CartService: CartService
  ) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  isOwnProduct(): boolean {
    return this.currentUser && this.product?.user === this.currentUser.id;
  }

  addToWishlist(productId: string) {
    this.spinner.show();
    this.WishlistService.addToWishlist(productId).subscribe({
      next: (res) => {
        console.log(res.message);
        this.spinner.hide();
        this.router.navigate(['/wishlist']);
      },
      error: (err) => {
        console.log(err.error?.message || 'Failed to add to wishlist');
        this.spinner.hide();
      },
    });
  }

  addToCart(product: Product) {
    this.spinner.show();
    const productId = product._id;
    this.CartService.addToCart(productId).subscribe({
      next: (res) => {
        console.log(res.message);
        this.spinner.hide();
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        console.log(err.error?.message || 'Failed to add to cart');
        this.spinner.hide();
      },
    });
  }

  /** Return all currently active promotions based on current date */
  getActivePromotions(): Promotion[] {
  const now = new Date();
  const activePromos = this.product.activePromotions?.filter(p => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  }) || [];

  // fallback: if promotionFlag is set, show at least first promo
  if (activePromos.length === 0 && this.product.promotionFlag) {
    return this.product.activePromotions?.slice(0, 1) || [];
  }

  return activePromos;
}


  /** Show discount from first active promotion (or 0 if none) */
  getDiscountPercent(): number {
    const activePromos = this.getActivePromotions();
    return activePromos.length > 0 ? activePromos[0].discountPercent : 0;
  }

  /** Final price based on first active promotion (if any) */
  getFinalPrice(): number {
    const discount = this.getDiscountPercent();
    return this.product.price - (this.product.price * discount) / 100;
  }
}
