import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { SpinnerService } from '../shared/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { UiButtonComponent } from '../shared/ui-button/ui-button.component';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiInputComponent } from '../shared/ui-input/ui-input.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

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
    RouterLink
  ],
})
export class CartComponent implements OnInit {
  borderRadius = '8px';
  cartItems: any[] = [];
  shippingFee = 300;
  showModal = false;
  orderForm!: FormGroup;

  constructor(
    private cartService: CartService,
    private spinner: SpinnerService,
    private toastr: ToastrService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.loadCart();
    this.initForm();
  }

  initForm() {
    this.orderForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      address: ['', Validators.required],
      paymentMethod: ['COD', Validators.required],
    });
  }


  autoUpdateBogoQuantity(item: any) {
  const promo = item.product.activePromotions?.find(
    (p: any) => p.buyQty && p.getQty
  );

  if (!promo) return;

  const totalQty = promo.buyQty + promo.getQty;

  // ❗ already correct → no API call
  if (item.quantity === totalQty) return;

  this.cartService.updateQuantity(item._id, totalQty).subscribe({
    next: () => {
      item.quantity = totalQty; // ✅ sync UI
    },
    error: () => {
      this.toastr.error('Failed to auto-update BOGO quantity');
    },
  });
}

  loadCart() {
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

        // ✅ AUTO UPDATE BOGO QUANTITIES
        this.cartItems.forEach((item) => {
          if (this.isBogo(item)) {
            this.autoUpdateBogoQuantity(item);
          }
        });
      } else {
        this.cartItems = [];
      }
      this.spinner.hide();
    },
    error: () => this.spinner.hide(),
  });
}


  // loadCart() {
  //   this.spinner.show();
  //   this.cartService.getCart().subscribe({
  //     next: (res) => {
  //       if (res.cart?.items) {
  //         this.cartItems = res.cart.items.map((item: any) => ({
  //           _id: item._id,
  //           product: item.product, // keep full product for promotions
  //           productId: item.product._id,
  //           name: item.product.name,
  //           image: item.product.images?.[0] || '',
  //           price: item.product.price,
  //           quantity: item.quantity || 1,
  //           seller: item.seller,
  //           commission: item.commission || 0,
  //           paidAmount: item.paidAmount || 0,
  //           isPaidToSeller: item.isPaidToSeller || false,
  //         }));
  //       } else {
  //         this.cartItems = [];
  //       }
  //       this.spinner.hide();
  //     },
  //     error: () => this.spinner.hide(),
  //   });
  // }

 // ===================== PROMOTION LOGIC =====================
isBogo(item: any): boolean {
  return item.product.activePromotions?.some((p: any) => p.buyQty && p.getQty) || false;
}

getBogoQtys(item: any) {
  const promo = item.product.activePromotions?.find((p: any) => p.buyQty && p.getQty);
  if (!promo) return { buyQty: 1, getQty: 0 };
  return { buyQty: promo.buyQty, getQty: promo.getQty };
}

calculateItemTotal(item: any): number {
  const promo = item.product.activePromotions?.[0];
  if (!promo) return item.price * item.quantity;

  const discount = promo.discountPercent || 0;

  if (promo.buyQty && promo.getQty) {
    const buyPrice = item.price * promo.buyQty; // only pay for buyQty
    return buyPrice - (buyPrice * discount) / 100;
  } else if (discount > 0) {
    return item.price * item.quantity - (item.price * item.quantity * discount) / 100;
  } else {
    return item.price * item.quantity;
  }
}

getPromotionLabel(item: any): string {
  const promo = item.product.activePromotions?.[0];
  if (!promo) return '';
  if (promo.buyQty && promo.getQty) {
    return `BOGO: Buy ${promo.buyQty} Get ${promo.getQty} Free`;
  } else if (promo.discountPercent) {
    return `${promo.discountPercent}% Off`;
  }
  return '';
}


  // ===================== CART TOTALS =====================
  calculateSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + this.calculateItemTotal(item), 0);
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + this.shippingFee;
  }

  // ===================== CART ACTIONS =====================
  // updateQuantity(item: any, event: Event) {
  //   const value = (event.target as HTMLInputElement).valueAsNumber;
  //   if (value <= 0) return;

  //   this.spinner.show();
  //   this.cartService.updateQuantity(item._id, value).subscribe({
  //     next: () => {
  //       this.spinner.hide();
  //       item.quantity = value;
  //     },
  //     error: (err) => {
  //       this.spinner.hide();
  //       this.toastr.error(err.error?.message || 'Failed to update quantity');
  //     },
  //   });
  // }

  updateQuantity(item: any, event: Event) {
  if (this.isBogo(item)) return; // 🔒 BOGO locked

  const value = (event.target as HTMLInputElement).valueAsNumber;
  if (value <= 0) return;

  this.spinner.show();
  this.cartService.updateQuantity(item._id, value).subscribe({
    next: () => {
      this.spinner.hide();
      item.quantity = value;
    },
    error: (err) => {
      this.spinner.hide();
      this.toastr.error(err.error?.message || 'Failed to update quantity');
    },
  });
}


  deleteItem(item: any) {
    this.spinner.show();
    this.cartService.removeFromCart(item._id).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter((i) => i._id !== item._id);
        this.spinner.hide();
      },
      error: () => this.spinner.hide(),
    });
  }

  // ===================== CHECKOUT =====================
  proceedToCheckout() {
    this.showModal = true;
  }

  // confirmOrder() {
  //   if (this.orderForm.invalid) {
  //     this.toastr.error('Please fill all required fields!');
  //     return;
  //   }

  //   const buyerData = this.orderForm.value;
  //   this.spinner.show();

  //   if (buyerData.paymentMethod === 'COD') {
  //     this.cartService
  //       .checkoutCart({ ...buyerData, paymentMethod: 'COD' })
  //       .subscribe({
  //         next: (res) => {
  //           this.spinner.hide();
  //           this.showModal = false;
  //           this.toastr.success('Order placed with COD!');
  //           this.loadCart();
  //         },
  //         error: () => this.spinner.hide(),
  //       });
  //   } else {
  //     this.cartService
  //       .checkoutCart({ ...buyerData, paymentMethod: 'Online' })
  //       .subscribe({
  //         next: (res) => {
  //           this.spinner.hide();
  //           this.showModal = false;
  //           if (res.url) {
  //             window.location.href = res.url; // Redirect to Stripe
  //           } else {
  //             this.toastr.error('Failed to start checkout!');
  //           }
  //         },
  //         error: () => this.spinner.hide(),
  //       });
  //   }
  // }

  confirmOrder() {
  if (this.orderForm.invalid) {
    this.toastr.error('Please fill all required fields!');
    return;
  }

  const buyerData = this.orderForm.value;

  // 🟢 Prepare cart items payload with totalPrice & promotionType
  const itemsPayload = this.cartItems.map(item => {
    const totalPrice = this.calculateItemTotal(item); // BOGO/discount applied
    const promotionType = this.isBogo(item)
      ? 'BOGO'
      : item.product.activePromotions?.[0]?.discountPercent
      ? 'discount'
      : null;

    return {
      productId: item.productId,
      quantity: item.quantity,
      totalPrice,
      promotionType,
    };
  });

  this.spinner.show();

  if (buyerData.paymentMethod === 'COD') {
    this.cartService
      .checkoutCart({ ...buyerData, paymentMethod: 'COD', items: itemsPayload })
      .subscribe({
        next: (res) => {
          this.spinner.hide();
          this.showModal = false;
          this.toastr.success('Order placed with COD!');
          this.loadCart();
        },
        error: () => this.spinner.hide(),
      });
  } else {
    this.cartService
      .checkoutCart({ ...buyerData, paymentMethod: 'Online', items: itemsPayload })
      .subscribe({
        next: (res) => {
          this.spinner.hide();
          this.showModal = false;
          if (res.url) {
            window.location.href = res.url; // Redirect to Stripe
          } else {
            this.toastr.error('Failed to start checkout!');
          }
        },
        error: () => this.spinner.hide(),
      });
  }
}

}
