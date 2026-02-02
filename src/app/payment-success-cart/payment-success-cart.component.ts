// src/app/payment-success-cart/payment-success-cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../services/cart.service';
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

  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) return;

    this.spinnerService.show();

    const sub = this.cartService.confirmPayment(sessionId).subscribe({
      next: (res) => {
        this.success = true;
        this.spinnerService.hide();
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
