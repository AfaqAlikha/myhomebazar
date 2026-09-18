import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductOrderService } from '../services/product-order.service';
import { Subscription } from 'rxjs';
import { NgClass, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css'],
  standalone: true,
  imports: [NgClass, NgIf, MatProgressSpinnerModule],
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  success: boolean | null = null;
  error: string | null = null;
  verifying = true;

  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productOrderService: ProductOrderService,
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) return;

    const sub = this.productOrderService.confirmPayment(sessionId).subscribe({
      next: () => {
        this.success = true;
        this.verifying = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Payment verification failed.';
        this.success = false;
        this.verifying = false;
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
