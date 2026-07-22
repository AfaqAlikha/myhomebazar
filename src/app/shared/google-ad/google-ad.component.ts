import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import {
  GOOGLE_ADS,
  GoogleAdPlacement,
  resolveAdSlot,
} from '../../core/config/google-ads.config';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

@Component({
  selector: 'app-google-ad',
  standalone: true,
  template: `
    @if (isBrowser && enabled && adSlot) {
      <div class="google-ad-wrap" [style.minHeight.px]="minHeight" [class]="layoutClass">
        <p class="google-ad-label" aria-hidden="true">Advertisement</p>
        <ins
          #adSlotRef
          class="adsbygoogle"
          style="display:block"
          [attr.data-ad-client]="publisherId"
          [attr.data-ad-slot]="adSlot"
          [attr.data-ad-format]="format"
          [attr.data-full-width-responsive]="fullWidthResponsive ? 'true' : null"
        ></ins>
      </div>
    }
  `,
  styleUrl: './google-ad.component.css',
})
export class GoogleAdComponent implements AfterViewInit, OnDestroy {
  @Input() placement: GoogleAdPlacement = 'horizontal';
  @Input() format: 'auto' | 'horizontal' | 'rectangle' | 'vertical' = 'auto';
  @Input() layoutClass = '';
  @Input() minHeight = 90;
  @Input() fullWidthResponsive = true;

  @ViewChild('adSlotRef') adSlotRef?: ElementRef<HTMLElement>;

  readonly isBrowser: boolean;
  readonly enabled = GOOGLE_ADS.enabled;
  readonly publisherId = GOOGLE_ADS.publisherId;

  get adSlot(): string {
    return resolveAdSlot(this.placement);
  }

  private loadTimer: ReturnType<typeof setTimeout> | null = null;
  private loaded = false;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.enabled || !this.adSlot) return;

    this.loadTimer = setTimeout(() => this.pushAd(), 150);
  }

  ngOnDestroy(): void {
    if (this.loadTimer) clearTimeout(this.loadTimer);
  }

  private pushAd(): void {
    if (this.loaded || !this.adSlotRef?.nativeElement) return;

    const status = this.adSlotRef.nativeElement.getAttribute('data-adsbygoogle-status');
    if (status === 'done' || status === 'filled') {
      this.loaded = true;
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      this.loaded = true;
    } catch {
      // AdSense unavailable (SSR, blocked script, etc.)
    }
  }
}
