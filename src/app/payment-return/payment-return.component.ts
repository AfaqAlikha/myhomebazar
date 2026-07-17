import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { AuthService } from '../auth/auth.service';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiButtonComponent } from '../shared/ui-button/ui-button.component';

@Component({
  selector: 'app-payment-return',
  standalone: true,
  imports: [CommonModule, UiCardComponent, UiButtonComponent, RouterLink],
  template: `
    <main class="min-h-[60vh] flex items-center justify-center p-4">
      <app-ui-card borderRadius="12px" class="p-8 max-w-md w-full text-center">
        <div *ngIf="loading" class="py-8">
          <div class="animate-spin w-10 h-10 border-4 border-[var(--color-accent)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Confirming your payment...</p>
        </div>
        <div *ngIf="!loading && success">
          <div class="text-5xl mb-4 text-green-600">✓</div>
          <h1 class="text-2xl font-bold mb-2">Payment Successful</h1>
          <p class="text-[var(--color-text-secondary)] mb-6">{{ message }}</p>
          <a routerLink="/order-history"><app-ui-button label="View Orders" variant="accent"></app-ui-button></a>
        </div>
        <div *ngIf="!loading && !success">
          <div class="text-5xl mb-4 text-red-500">✕</div>
          <h1 class="text-2xl font-bold mb-2">Payment Failed</h1>
          <p class="text-[var(--color-text-secondary)] mb-6">{{ message }}</p>
          <a routerLink="/cart"><app-ui-button label="Back to Cart" variant="accent"></app-ui-button></a>
        </div>
      </app-ui-card>
    </main>
  `,
})
export class PaymentReturnComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  loading = true;
  success = false;
  message = '';

  ngOnInit(): void {
    const basketId =
      this.route.snapshot.queryParamMap.get('basketId')
      || this.route.snapshot.queryParamMap.get('pp_TxnRefNo')
      || this.route.snapshot.queryParamMap.get('orderRefNum');

    const status = this.route.snapshot.queryParamMap.get('status');
    const mock = this.route.snapshot.queryParamMap.get('mock');

    if (!basketId) {
      this.loading = false;
      this.success = false;
      this.message = 'Invalid payment reference.';
      return;
    }

    if (status === 'failed' || status === 'cancelled') {
      this.loading = false;
      this.success = false;
      this.message = 'Payment was cancelled or declined.';
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken() || ''}`,
    });

    this.http
      .post(API_ENDPOINTS.payments.confirm, { basketId }, { headers })
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.success = true;
          this.message = res.message || (mock ? 'Test payment confirmed.' : 'Your order is confirmed.');
        },
        error: (err) => {
          this.loading = false;
          this.success = false;
          this.message = err?.error?.message || 'Could not confirm payment.';
        },
      });
  }
}
