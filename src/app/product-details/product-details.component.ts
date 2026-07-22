import { AfterViewInit, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgFor, NgIf, NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { StarRatingComponent } from '../shared/star-rating/star-rating.component';
import { MatIconModule } from '@angular/material/icon';
import { switchMap, tap, catchError, of } from 'rxjs';
import { ProductService } from '../services/product.service';
import { ProductOrderService } from '../services/product-order.service';
import { SeoService } from '../services/seo';
import { UiButtonComponent } from '../shared/ui-button/ui-button.component';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiInputComponent } from '../shared/ui-input/ui-input.component';
import { ProductGalleryComponent } from '../shared/components/product-gallery/product-gallery.component';
import { AuthService } from '../auth/auth.service';
import { isOwnProduct } from '../utils/auth';
import { ShippingService, ShippingQuote } from '../services/shipping.service';
import { PaymentMethodsComponent } from '../shared/payment-methods/payment-methods.component';
import { PaymentGatewayService } from '../services/payment-gateway.service';
import { ProductEngagementService } from '../services/product-engagement.service';
import {
  hasLocalProductView,
  markLocalProductView,
} from '../utils/visitor-id';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css'],
  standalone: true,
  imports: [
    UiButtonComponent,
    UiCardComponent,
    UiInputComponent,
    ProductGalleryComponent,
    NgFor,
    NgIf,
    NgClass,
    ReactiveFormsModule,
    StarRatingComponent,
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatIconModule,
    PaymentMethodsComponent,
  ],
})
export class ProductDetailsComponent implements OnInit, AfterViewInit {
  borderRadius = '10px';
  product: any = null;

  selectedColor = '';
  selectedSize = '';
  selectedRam = '';
  selectedWordSize = '';
  selectedNumberSize = '';
  selectedMaterial = '';
  selectedStyle = '';
  selectedCapacity = '';
  selectedStorage = '';

  quantity = 1;
  subtotal = 0;
  shippingQuote: ShippingQuote | null = null;
  totalPrice = 0;

  showModal = false;

  username = '';
  bio = '';
  id = '';

  orderForm!: FormGroup;

  isLoading = true;
  loadError = false;
  orderSubmitting = false;
  currentUserId = '';
  canOrder = true;
  isOutOfStock = false;
  likeLoading = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private productService: ProductService,
    private productOrderService: ProductOrderService,
    private seo: SeoService,
    private auth: AuthService,
    private shippingService: ShippingService,
    private paymentGateway: PaymentGatewayService,
    private engagementService: ProductEngagementService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.auth.getUser()?.id ?? '';

    this.orderForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      address: ['', Validators.required],
      paymentMethod: ['COD', Validators.required],
    });

    const user = this.auth.getUser();
    if (user) {
      this.orderForm.patchValue(
        {
          name: user.name || '',
          email: user.email || '',
          city: user.city || '',
          country: user.country || '',
        },
        { emitEvent: false },
      );
    }

    this.orderForm
      .get('city')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.calculateTotalPrice());

    this.route.paramMap
      .pipe(
        tap(() => {
          this.isLoading = true;
          this.loadError = false;
          this.product = null;
          this.showModal = false;
        }),
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            this.loadError = true;
            this.isLoading = false;
            return of(null);
          }
          return this.productService.getProductById(id).pipe(
            catchError(() => {
              this.loadError = true;
              this.isLoading = false;
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        if (!res) return;
        this.applyProduct(res);
      });
  }

  ngAfterViewInit(): void {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // AdSense unavailable during SSR
    }
  }

  private applyProduct(res: any): void {
    const product = res?.product ?? res?.data?.product ?? null;

    if (!product) {
      this.loadError = true;
      this.isLoading = false;
      return;
    }

    this.product = product;
    this.username = this.product?.user?.name || '';
    this.bio = this.product?.user?.bio || '';
    this.id = this.product?.user?._id || this.product?.user?.id || '';

    const isOwn = isOwnProduct(this.product, this.currentUserId);
    const inStock = Number(this.product?.countInStock ?? 0) > 0;
    this.canOrder = !isOwn && inStock;
    this.isOutOfStock = !inStock;
    this.product.isAwaitingReview =
      this.product.awaitingReviewUsers?.includes(this.currentUserId) || false;

    this.selectedColor = this.product?.colors?.[0] ?? '';
    this.selectedSize = this.product?.sizes?.[0] ?? '';
    this.selectedRam = this.product?.mobileRam?.[0] ?? '';
    this.selectedWordSize = this.product?.wordSizes?.[0] ?? '';
    this.selectedNumberSize = this.product?.numberSizes?.[0] ?? '';
    this.selectedMaterial = this.product?.materials?.[0] ?? '';
    this.selectedStyle = this.product?.styles?.[0] ?? '';
    this.selectedCapacity = this.product?.capacities?.[0] ?? '';
    this.selectedStorage = this.product?.storages?.[0] ?? '';

    this.quantity = 1;
    this.calculateTotalPrice();
    this.seo.setProductSeo(this.product);
    this.isLoading = false;
    this.loadError = false;

    if (this.product?.hasViewed) {
      markLocalProductView(this.product._id);
    }

    this.trackUniqueView();
  }

  private trackUniqueView(): void {
    const productId = this.product?._id;
    if (!productId || this.product?.hasViewed || hasLocalProductView(productId)) {
      return;
    }

    this.engagementService.recordView(productId).subscribe({
      next: (res) => {
        if (typeof res.viewCount === 'number') {
          this.product.viewCount = res.viewCount;
        } else if (res.recorded) {
          this.product.viewCount = (this.product.viewCount || 0) + 1;
        }
        this.product.hasViewed = true;
        markLocalProductView(productId);
      },
      error: () => {
        markLocalProductView(productId);
      },
    });
  }

  toggleLike(): void {
    if (!this.product?._id || this.likeLoading) return;

    if (!this.currentUserId) {
      this.router.navigate(['/signin'], {
        queryParams: { returnUrl: `/product/details/${this.product._id}` },
      });
      return;
    }

    if (!this.canOrder) return;

    this.likeLoading = true;
    this.engagementService.toggleLike(this.product._id).subscribe({
      next: (res) => {
        this.likeLoading = false;
        if (typeof res.likeCount === 'number') {
          this.product.likeCount = res.likeCount;
        }
        if (typeof res.liked === 'boolean') {
          this.product.isLikedByMe = res.liked;
        }
      },
      error: () => {
        this.likeLoading = false;
      },
    });
  }

  formatEngagementCount(value?: number): string {
    const count = Number(value) || 0;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
  }

  calculateTotalPrice(): void {
    this.subtotal = (this.product?.price || 0) * this.quantity;
    const weightKg = (Number(this.product?.weightKg) || 0.5) * this.quantity;
    const city = this.orderForm?.get('city')?.value || '';
    this.shippingService.getQuote(this.subtotal, { city, weightKg }).subscribe((quote) => {
      this.shippingQuote = quote;
      this.totalPrice = quote.grandTotal;
    });
  }

  getShippingLabel(): string {
    if (!this.shippingQuote) return 'Calculating…';
    if (this.shippingQuote.shippingFee === 0) return 'FREE';
    return `Rs ${this.shippingQuote.shippingFee.toLocaleString()}`;
  }

  isShippingFree(): boolean {
    return !!this.shippingQuote && this.shippingQuote.shippingFee === 0;
  }

  getFreeShippingHint(): string {
    if (!this.shippingQuote || this.shippingQuote.isFreeShipping) return '';
    const remaining = this.shippingQuote.freeShippingThreshold - this.subtotal;
    if (remaining <= 0) return '';
    return `Add Rs ${remaining.toLocaleString()} more for free delivery`;
  }

  increment(): void {
    this.quantity++;
    this.calculateTotalPrice();
  }

  decrement(): void {
    if (this.quantity > 1) {
      this.quantity--;
      this.calculateTotalPrice();
    }
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  selectSize(size: string): void {
    this.selectedSize = size;
  }

  openModal(): void {
    if (!this.canOrder) return;
    this.calculateTotalPrice();
    this.showModal = true;
  }

  confirmOrder(): void {
    if (!this.canOrder) return;
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    const orderData = {
      productId: this.product?._id,
      quantity: this.quantity,
      color: this.selectedColor,
      size: this.selectedSize,
      ram: this.selectedRam,
      wordSize: this.selectedWordSize,
      numberSize: this.selectedNumberSize,
      ...this.orderForm.value,
    };

    this.orderSubmitting = true;

    this.productOrderService.createOrder(orderData).subscribe({
      next: (res: any) => {
        this.orderSubmitting = false;
        this.showModal = false;
        if (res.checkout) {
          this.paymentGateway.redirectToGateway(res.checkout);
          return;
        }
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          this.productService.getProductById(id).subscribe((r) => this.applyProduct(r));
        }
      },
      error: () => {
        this.orderSubmitting = false;
      },
    });
  }

  isPromotionActive(): boolean {
    if (!this.product?.isPromoted) return false;
    if (!this.product.promotionExpiresAt) return !!this.product.isPromoted;
    return new Date(this.product.promotionExpiresAt).getTime() > Date.now();
  }

  getPromotionBadge(): string {
    if (!this.isPromotionActive()) return '';
    return this.product.promotionLabel?.trim() || 'Special Deal';
  }

  getPromotionDetailText(): string {
    if (!this.isPromotionActive()) return '';
    return this.product.promotionDealText?.trim() || 'Limited promotional offer on this item.';
  }

  getPromotionExpiryLabel(): string {
    if (!this.isPromotionActive() || !this.product.promotionExpiresAt) return '';
    return new Date(this.product.promotionExpiresAt).toLocaleDateString();
  }
}
