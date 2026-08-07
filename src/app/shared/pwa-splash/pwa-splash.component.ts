import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { AppBrandingService } from '../../core/services/app-branding.service';
import { PwaService } from '../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-splash',
  standalone: true,
  imports: [NgIf],
  template: `
    <div
      *ngIf="visible()"
      class="pwa-splash"
      [class.pwa-splash--hide]="hiding()"
      aria-hidden="true"
    >
      <div class="pwa-splash__inner">
        <img
          *ngIf="imageUrl()"
          [src]="imageUrl()"
          alt="MyHomeBazar"
          class="pwa-splash__image"
        />
        <img
          *ngIf="!imageUrl()"
          src="/icons/icon-192.png"
          alt="MyHomeBazar"
          class="pwa-splash__fallback"
        />
        <p class="pwa-splash__brand">MyHomeBazar</p>
      </div>
    </div>
  `,
  styles: [
    `
      .pwa-splash {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
        transition: opacity 0.45s ease, visibility 0.45s ease;
      }

      .pwa-splash--hide {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }

      .pwa-splash__inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        max-width: min(92vw, 420px);
      }

      .pwa-splash__image {
        width: 100%;
        max-height: 70vh;
        object-fit: contain;
        border-radius: 1rem;
      }

      .pwa-splash__fallback {
        width: 128px;
        height: 128px;
        object-fit: contain;
      }

      .pwa-splash__brand {
        margin: 0;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        background: linear-gradient(90deg, #4caf50 0%, #ff9800 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
    `,
  ],
})
export class PwaSplashComponent implements OnInit, OnDestroy {
  visible = signal(false);
  hiding = signal(false);
  imageUrl = signal<string | null>(null);

  private isBrowser: boolean;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private removeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly minVisibleMs = 1200;
  private readonly maxVisibleMs = 3500;
  private shownAt = 0;

  constructor(
    private branding: AppBrandingService,
    private pwa: PwaService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Show splash on cold load / PWA launch (not every soft navigation)
    if (!this.shouldShowSplash()) return;

    this.visible.set(true);
    this.shownAt = Date.now();

    this.branding.getSplash().subscribe({
      next: (res) => {
        const url = res?.splash?.image;
        if (url) this.imageUrl.set(url);
        this.scheduleHide();
      },
      error: () => this.scheduleHide(),
    });

    // Safety: never leave splash forever
    this.hideTimer = setTimeout(() => this.hide(), this.maxVisibleMs);
  }

  ngOnDestroy(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    if (this.removeTimer) clearTimeout(this.removeTimer);
  }

  private shouldShowSplash(): boolean {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      const isReload = nav?.type === 'reload';
      const isNavigate = !nav || nav.type === 'navigate';
      return this.pwa.isStandalone() || isNavigate || isReload;
    } catch {
      return true;
    }
  }

  private scheduleHide(): void {
    const elapsed = Date.now() - this.shownAt;
    const wait = Math.max(0, this.minVisibleMs - elapsed);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hide(), wait);
  }

  private hide(): void {
    this.hiding.set(true);
    this.removeTimer = setTimeout(() => this.visible.set(false), 480);
  }
}
