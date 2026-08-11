import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { SpinnerService } from '../shared/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../auth/auth.service';
import { UiButtonComponent } from '../shared/ui-button/ui-button.component';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiInputComponent } from '../shared/ui-input/ui-input.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PaymentMethodsComponent } from '../shared/payment-methods/payment-methods.component';
import { PaymentGatewayService } from '../services/payment-gateway.service';
import { ShippingService, ShippingQuote } from '../services/shipping.service';
import { pakistaniPhoneValidator } from '../utils/pakistani-phone.validator';
import { LocationFieldsComponent } from '../shared/location-fields/location-fields.component';
import {
  GuestCartItem,
  readGuestCart,
  removeGuestCartItem,
  updateGuestCartQuantity,
  clearGuestCart,
} from '../services/guest-cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  standalone: true,
  imports: [
    UiCardComponent,
    UiInputComponent,
    UiButtonComponent,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    PaymentMethodsComponent,
    LocationFieldsComponent,
  ],
})
export class CartComponent implements OnInit {
  borderRadius = '8px';
  cartItems: any[] = [];
  shippingQuote: ShippingQuote | null = null;
  showModal = false;
  orderSubmitting = false;
  orderForm!: FormGroup;
  isGuestMode = false;

  constructor(
    private cartService: CartService,
    private shippingService: ShippingService,
    private paymentGateway: PaymentGatewayService,
    private authService: AuthService,
    private spinner: SpinnerService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isGuestMode = !this.authService.isLoggedIn();
    this.initForm();
    this.loadCart();
  }

  initForm(): void {
    this.orderForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, pakistaniPhoneValidator]],
      state: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      address: ['', Validators.required],
      nearestLandmark: ['', Validators.required],
      paymentMethod: ['COD', Validators.required],
    });

    const user = this.authService.getUser();
    if (user) {
      this.orderForm.patchValue(
        {
          name: user.name || '',
          email: user.email || '',
          state: user.state || '',
          city: user.city || '',
          country: user.country || '',
        },
        { emitEvent: false },
      );
    }

    this.orderForm.get('city')?.valueChanges.subscribe(() => {
      if (this.cartItems.length) this.refreshShippingQuote();
    });
  }

  onOrderCityChange(): void {
    if (this.cartItems.length) this.refreshShippingQuote();
  }

  loadCart(): void {
    if (this.isGuestMode) {
      this.cartItems = this.mapGuestItems(readGuestCart());
      if (this.cartItems.length) {
        this.refreshShippingQuote();
      } else {
        this.shippingQuote = null;
      }
      return;
    }

    this.spinner.show();
    this.cartService.getCart().subscribe({
      next: (res) => {
        if (res.cart?.items) {
          this.cartItems = res.cart.items.map((item: any) => ({
            _id: item._id,
            product: item.product,
            productId: item.product._id,
            name: item.product.name,
            image: item.product.images?.[0] || '',
            price: item.product.price,
            quantity: item.quantity || 1,
            seller: item.seller,
          }));

          if (res.grandTotal !== undefined) {
            this.shippingQuote = {
              subtotal: res.subtotal ?? res.totalAmount ?? this.calculateSubtotal(),
              shippingFee: res.shippingFee ?? 0,
              grandTotal: res.grandTotal ?? this.calculateSubtotal(),
              isFreeShipping: !!res.isFreeShipping,
              freeShippingThreshold: res.freeShippingThreshold ?? 5000,
              message: res.shippingMessage || '',
            };
          } else {
            this.refreshShippingQuote();
          }
        } else {
          this.cartItems = [];
          this.shippingQuote = null;
        }
        if (this.cartItems.length && !this.shippingQuote) {
          this.refreshShippingQuote();
        }
        this.spinner.hide();
      },
      error: () => this.spinner.hide(),
    });
  }

  private mapGuestItems(items: GuestCartItem[]) {
    return items.map((item) => ({
      _id: item.id,
      product: item.product,
      productId: item.productId,
      name: item.product.name,
      image: item.product.images?.[0] || '',
      price: item.product.price,
      quantity: item.quantity || 1,
    }));
  }

  calculateItemTotal(item: any): number {
    return item.price * item.quantity;
  }

  calculateSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + this.calculateItemTotal(item), 0);
  }

  refreshShippingQuote(): void {
    const subtotal = this.calculateSubtotal();
    const city = this.orderForm?.get('city')?.value || '';
    const weightKg = this.calculateTotalWeightKg();
    const productIds = this.cartItems
      .map((item) => item.product?._id || item.productId)
      .filter(Boolean);
    const quantities = this.cartItems.map((item) => item.quantity || 1);

    this.shippingService
      .getQuote(subtotal, {
        city,
        weightKg,
        productIds,
        quantities,
      })
      .subscribe((quote) => {
        this.shippingQuote = quote;
      });
  }

  calculateTotalWeightKg(): number {
    return this.cartItems.reduce((sum, item) => {
      const w = Number(item.product?.weightKg) || 0.5;
      return sum + w * (item.quantity || 1);
    }, 0);
  }

  getShippingFee(): number {
    return this.shippingQuote?.shippingFee ?? 0;
  }

  getShippingLabel(): string {
    if (!this.shippingQuote) return 'Calculating…';
    if (this.shippingQuote.shippingFee === 0) return 'FREE';
    return `Rs ${this.shippingQuote.shippingFee.toLocaleString()}`;
  }

  isShippingFree(): boolean {
    return !!this.shippingQuote && this.shippingQuote.shippingFee === 0;
  }

  calculateTotal(): number {
    return this.shippingQuote?.grandTotal ?? this.calculateSubtotal();
  }

  getFreeShippingHint(): string {
    if (!this.shippingQuote) return '';
    if (this.shippingQuote.isFreeShipping) {
      return this.shippingQuote.message || 'Free delivery applied';
    }
    if (this.shippingQuote.sellerFreeDeliveryRemaining && this.shippingQuote.sellerFreeDeliveryRemaining > 0) {
      return this.shippingQuote.message;
    }
    const remaining = this.shippingQuote.freeShippingThreshold - this.calculateSubtotal();
    if (remaining <= 0) return this.shippingQuote.message || '';
    return `Add Rs ${remaining.toLocaleString()} more for platform free delivery`;
  }

  updateQuantity(item: any, event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    if (value <= 0) return;

    if (this.isGuestMode) {
      this.cartItems = this.mapGuestItems(updateGuestCartQuantity(item._id, value));
      item.quantity = value;
      this.refreshShippingQuote();
      return;
    }

    this.cartService.updateQuantity(item._id, value).subscribe({
      next: () => {
        item.quantity = value;
        this.refreshShippingQuote();
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'Failed to update quantity');
      },
    });
  }

  deleteItem(item: any): void {
    if (this.isGuestMode) {
      this.cartItems = this.mapGuestItems(removeGuestCartItem(item._id));
      this.refreshShippingQuote();
      return;
    }

    this.spinner.show();
    this.cartService.removeFromCart(item._id).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter((i) => i._id !== item._id);
        this.refreshShippingQuote();
        this.spinner.hide();
      },
      error: () => this.spinner.hide(),
    });
  }

  proceedToCheckout(): void {
    this.refreshShippingQuote();
    this.showModal = true;
  }

  confirmOrder(): void {
    if (this.orderForm.invalid) {
      this.toastr.error('Please fill all required fields!');
      return;
    }

    const buyerData = this.orderForm.value;

    const itemsPayload = this.cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      totalPrice: this.calculateItemTotal(item),
    }));

    this.orderSubmitting = true;

    if (buyerData.paymentMethod === 'COD') {
      this.cartService
        .checkoutCart({ ...buyerData, paymentMethod: 'COD', items: itemsPayload })
        .subscribe({
          next: (res) => {
            this.orderSubmitting = false;
            this.showModal = false;
            if (this.isGuestMode) {
              clearGuestCart();
              const orders = res?.data?.orders || res?.orders || [];
              const orderId = orders[0]?._id;
              this.router.navigate(['/order-success'], {
                queryParams: orderId ? { orderId, guest: '1' } : { guest: '1' },
              });
              return;
            }
            this.toastr.success('Order placed with COD!');
            this.loadCart();
          },
          error: () => {
            this.orderSubmitting = false;
          },
        });
      return;
    }

    this.cartService
      .checkoutCart({ ...buyerData, items: itemsPayload })
      .subscribe({
        next: (res) => {
          this.orderSubmitting = false;
          this.showModal = false;
          const checkout = res?.data?.checkout || res?.checkout;
          if (checkout) {
            if (this.isGuestMode) {
              clearGuestCart();
            }
            this.paymentGateway.redirectToGateway(checkout);
          } else {
            this.toastr.error('Failed to start payment!');
          }
        },
        error: () => {
          this.orderSubmitting = false;
        },
      });
  }
}
