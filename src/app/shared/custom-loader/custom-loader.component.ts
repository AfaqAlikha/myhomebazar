import { AsyncPipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { SpinnerService } from '../spinner.service';

@Component({
  selector: 'app-custom-loader',
  standalone: true,
  imports: [NgIf, AsyncPipe],
  template: `
    <div class="custom-loader-overlay" *ngIf="spinner.visible$ | async" aria-live="polite" aria-busy="true">
      <div class="custom-loader-card">
        <div class="custom-loader-logo-wrap">
          <img
            *ngIf="logoUrl; else logoFallback"
            [src]="logoUrl"
            alt="Loading"
            class="custom-loader-logo"
          />
          <ng-template #logoFallback>
            <div class="custom-loader-logo-fallback">M</div>
          </ng-template>
        </div>
        <div class="custom-loader-track">
          <div class="custom-loader-bar"></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .custom-loader-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--color-background) 35%, transparent);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .custom-loader-card {
        width: 200px;
        height: 140px;
        border-radius: 16px;
        padding: 14px 16px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        background: color-mix(in srgb, var(--color-card) 72%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
        box-shadow:
          0 12px 40px color-mix(in srgb, var(--color-text) 18%, transparent),
          inset 0 1px 0 color-mix(in srgb, #fff 24%, transparent);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .custom-loader-logo-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 0;
      }

      .custom-loader-logo {
        max-width: 88px;
        max-height: 64px;
        width: auto;
        height: auto;
        object-fit: contain;
        display: block;
      }

      .custom-loader-logo-fallback {
        width: 52px;
        height: 52px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
        font-weight: 700;
        color: #fff;
        background: linear-gradient(
          135deg,
          var(--color-accent),
          color-mix(in srgb, var(--color-accent) 65%, #fff)
        );
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 22%, transparent);
      }

      .custom-loader-track {
        width: 100%;
        height: 6px;
        border-radius: 9999px;
        overflow: hidden;
        background: color-mix(in srgb, var(--color-border) 70%, transparent);
      }

      .custom-loader-bar {
        width: 42%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(
          90deg,
          transparent,
          var(--color-accent),
          color-mix(in srgb, var(--color-accent-hover) 80%, #fff),
          transparent
        );
        animation: custom-loader-shimmer 1.15s ease-in-out infinite;
      }

      @keyframes custom-loader-shimmer {
        0% {
          transform: translateX(-120%);
        }
        100% {
          transform: translateX(320%);
        }
      }
    `,
  ],
})
export class CustomLoaderComponent implements OnInit {
  logoUrl = '';

  constructor(
    public spinner: SpinnerService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.productService.getAppLogo().subscribe({
      next: (res: any) => {
        const image = res?.logo?.image || res?.logo;
        if (typeof image === 'string' && image.trim()) {
          this.logoUrl = image;
        }
      },
    });
  }
}
