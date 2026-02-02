import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgFor, NgIf, NgClass, DatePipe, DecimalPipe, NgStyle } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { ProductService } from '../services/product.service';
import { ProductOrderService } from '../services/product-order.service';
import { UiButtonComponent } from '../shared/ui-button/ui-button.component';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiInputComponent } from '../shared/ui-input/ui-input.component';
import { MatIconModule } from '@angular/material/icon';
import { SpinnerService } from '../shared/spinner.service';
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
    NgFor,
    NgIf,
    NgClass,
    ReactiveFormsModule,
    RatingModule,
    DatePipe,
    DecimalPipe,
    RouterLink,
    NgStyle,
    MatIconModule,
  ],
})
export class ProductDetailsComponent implements OnInit, AfterViewInit {
  borderRadius = '10px';
  product: any;
  mainImage!: string;

  selectedColor!: string;
  selectedSize!: string;
  selectedRam!: string;
  selectedWordSize!: string;
  selectedNumberSize!: string;

  quantity = 1;
  totalPrice = 0;
  isBogo = false;
  bogoBuyQty = 0;
  bogoGetQty = 0;

  showModal = false;

  username = '';
  bio = '';
  id = '';

  orderForm!: FormGroup;
  reviewForm!: FormGroup;

  isLoading = false;
  currentUserId = '';
  canOrder = true;
  private adsRendered = false;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private productService: ProductService,
    private productOrderService: ProductOrderService,
    private spinnerService: SpinnerService,
  ) {}

  // ================= INIT =================
  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user.id || '';

    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) this.loadProduct(productId);

    // Order Form
    this.orderForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      address: ['', Validators.required],
      paymentMethod: ['COD', Validators.required],
    });

    // Review Form
    this.reviewForm = this.fb.group({
      rating: [0, Validators.required],
      comment: ['', Validators.required],
    });
  }

  ngAfterViewInit(): void {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }

  // ================= LOAD PRODUCT =================
  loadProduct(id: string) {
    this.isLoading = true;
    this.spinnerService.show();

    this.productService.getProductById(id).subscribe({
      next: (res) => {
        this.product = res.product;

        this.username = this.product?.user?.name || '';
        this.bio = this.product?.user?.bio || '';
        this.id = this.product?.user?._id || '';

        this.canOrder = this.currentUserId !== this.product?.user?._id;
        this.product.isAwaitingReview =
          this.product.awaitingReviewUsers?.includes(this.currentUserId) || false;

        if (this.product?.images?.length) this.mainImage = this.product.images[0];
        if (this.product?.colors?.length) this.selectedColor = this.product.colors[0];
        if (this.product?.sizes?.length) this.selectedSize = this.product.sizes[0];
        if (this.product?.mobileRam?.length) this.selectedRam = this.product.mobileRam[0];
        if (this.product?.wordSizes?.length) this.selectedWordSize = this.product.wordSizes[0];
        if (this.product?.numberSizes?.length)
          this.selectedNumberSize = this.product.numberSizes[0];

        // BOGO & Discount Handling
        this.checkBogoPromotion();
        this.calculateTotalPrice();

        this.isLoading = false;
        this.spinnerService.hide();
      },
      error: () => {
        this.isLoading = false;
        this.spinnerService.hide();
      },
    });
  }

  // ==================== BOGO Logic ====================
  checkBogoPromotion() {
    const promo = this.product.activePromotions?.find((p: any) => p.buyQty && p.getQty);

    if (promo) {
      this.isBogo = true;
      this.bogoBuyQty = promo.buyQty;
      this.bogoGetQty = promo.getQty;
      this.quantity = promo.buyQty + promo.getQty; // total items
    } else {
      this.isBogo = false;
      this.quantity = 1;
    }
  }

  calculateTotalPrice() {
    const promo = this.product.activePromotions?.[0]; // assume single active promo

    if (promo) {
      const discountPercent = promo.discountPercent || 0;

      if (promo.buyQty && promo.getQty) {
        // BOGO case
        const buyPrice = this.product.price * promo.buyQty;
        this.totalPrice = buyPrice - (buyPrice * discountPercent) / 100;
      } else if (discountPercent > 0) {
        // Simple discount without BOGO
        this.totalPrice = this.product.price - (this.product.price * discountPercent) / 100;
      } else {
        this.totalPrice = this.product.price;
      }
    } else {
      this.totalPrice = this.product.price;
    }
  }

  getOriginalPrice() {
    return this.product?.price;
  }

  getDiscountedPrice() {
    const promo = this.product.activePromotions?.[0];
    if (!promo) return this.product?.price;
    const discount = promo.discountPercent || 0;

    if (promo.buyQty && promo.getQty) {
      const buyPrice = this.product.price * promo.buyQty;
      return buyPrice - (buyPrice * discount) / 100;
    } else if (discount > 0) {
      return this.product.price - (this.product.price * discount) / 100;
    } else {
      return this.product.price;
    }
  }

  // ================= UI HELPERS =================
  setMainImage(img: string) {
    this.mainImage = img;
  }

  increment() {
    if (!this.isBogo) {
      this.quantity++;
      this.calculateTotalPrice();
    }
  }

  decrement() {
    if (!this.isBogo && this.quantity > 1) {
      this.quantity--;
      this.calculateTotalPrice();
    }
  }

  selectColor(color: string) {
    this.selectedColor = color;
  }

  selectSize(size: string) {
    this.selectedSize = size;
  }

  openModal() {
    this.showModal = true;
  }

  // ================= PLACE ORDER =================

  confirmOrder() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    // Build order data
    const orderData: any = {
      productId: this.product?._id,
      quantity: this.quantity,
      color: this.selectedColor,
      size: this.selectedSize,
      ram: this.selectedRam,
      wordSize: this.selectedWordSize,
      numberSize: this.selectedNumberSize,
      ...this.orderForm.value,
    };

    // ✅ Only send promotion info if active promotion exists
    const promo = this.product.activePromotions?.[0];
    if (promo) {
      orderData.promotionType =
        promo.buyQty && promo.getQty ? 'BOGO' : promo.discountPercent ? 'discount' : null;
      if (orderData.promotionType) {
        orderData.totalPrice = this.totalPrice; // frontend-calculated
      }
    }

    this.showModal = false;
    this.isLoading = true;
    this.spinnerService.show();

    this.productOrderService.createOrder(orderData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.spinnerService.hide();
        if (this.product?._id) this.loadProduct(this.product._id);
        if (res.url) window.location.href = res.url;
      },
      error: () => {
        this.isLoading = false;
        this.spinnerService.hide();
      },
    });
  }

  // ================= COMPLETE / CANCEL ORDER =================
  completeOrder() {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    this.updateOrderStatus('completed');
  }

  cancelOrder() {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    this.updateOrderStatus('cancelled');
  }

  private updateOrderStatus(status: 'completed' | 'cancelled') {
    this.isLoading = true;
    this.spinnerService.show();

    const { rating, comment } = this.reviewForm.value;

    this.productOrderService.getOrderByProduct(this.product._id).subscribe({
      next: (res: any) => {
        const orderId = res.orderId;

        this.productOrderService
          .updateOrderStatus(orderId, {
            status,
            rating,
            comment,
          })
          .subscribe({
            next: () => {
              this.product.isAwaitingReview = false;
              this.reviewForm.reset({ rating: 0, comment: '' });
              this.isLoading = false;
              this.spinnerService.hide();
            },
            error: () => {
              this.isLoading = false;
              this.spinnerService.hide();
            },
          });
      },
      error: () => {
        this.isLoading = false;
        this.spinnerService.hide();
      },
    });
  }
}
