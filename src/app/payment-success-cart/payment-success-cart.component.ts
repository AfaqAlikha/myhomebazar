import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { AuthService } from '../auth/auth.service';
import { SpinnerService } from '../shared/spinner.service';
import { Subscription } from 'rxjs';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-payment-success-cart',
  templateUrl: './payment-success-cart.component.html',
  styleUrls: ['./payment-success-cart.component.css'],
  standalone: true,
  imports: [NgClass, NgIf],
})
export class PaymentSuccessCartComponent implements OnInit, OnDestroy {
  success: boolean | null = null;
  error: string | null = null;
  orderId = '';

  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private authService: AuthService,
    private spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) return;

    this.spinnerService.show();

    const sub = this.cartService.confirmPayment(sessionId).subscribe({
      next: (res: any) => {
        this.success = true;
        this.spinnerService.hide();

        const orders = res?.data?.orders || res?.orders;
        this.orderId = orders?.[0]?._id || '';

        if (!this.authService.isLoggedIn() && this.orderId) {
          this.router.navigate(['/order-success'], {
            queryParams: { orderId: this.orderId, guest: '1' },
            replaceUrl: true,
          });
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'Payment verification failed.';
        this.success = false;
        this.spinnerService.hide();
      },
    });

    this.subscription.add(sub);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
