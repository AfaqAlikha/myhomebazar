import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductOrderService } from '../services/product-order.service';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css'],
  standalone: true,
  imports: [NgClass, NgIf],
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  success: boolean | null = null;
  error: string | null = null;
  orderId = '';

  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productOrderService: ProductOrderService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) return;

    const sub = this.productOrderService.confirmPayment(sessionId).subscribe({
      next: (res: any) => {
        this.success = true;

        const order = res?.order || res?.data?.order;
        const orders = res?.orders || res?.data?.orders;
        this.orderId = order?._id || orders?.[0]?._id || '';

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
