import { isPlatformBrowser, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import {
  GOOGLE_ADS,
  GoogleAdVariant,
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
  imports: [NgClass],
  template: `
    @if (isBrowser && enabled && adSlot && effectiveVariant) {
      <div
        class="google-ad-wrap"
        [ngClass]="[
          effectiveVariant === 'horizontal' ? 'google-ad-wrap--horizontal' : 'google-ad-wrap--vertical',
          layoutClass,
        ]"
      >
        <p class="google-ad-label" aria-hidden="true">Advertisement</p>
        <ins
          #adSlotRef
          class="adsbygoogle"
          style="display:block"
          [attr.data-ad-client]="publisherId"
          [attr.data-ad-slot]="adSlot"
          [attr.data-ad-format]="adFormat"
          [attr.data-full-width-responsive]="fullWidthResponsive ? 'true' : null"
        ></ins>
      </div>
    }
  `,
  styleUrl: './google-ad.component.css',
})
export class GoogleAdComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() variant: GoogleAdVariant = 'horizontal';
  /** On mobile uses horizontal slot; on desktop uses vertical slot (shop/category rails). */
  @Input() responsiveRail = false;
  @Input() layoutClass = '';
  @Input() fullWidthResponsive = true;

  @ViewChild('adSlotRef') adSlotRef?: ElementRef<HTMLElement>;

  readonly isBrowser: boolean;
  readonly enabled = GOOGLE_ADS.enabled;
  readonly publisherId = GOOGLE_ADS.publisherId;
  effectiveVariant: GoogleAdVariant | null = null;

  get adSlot(): string {
    return this.effectiveVariant ? resolveAdSlot(this.effectiveVariant) : '';
  }

  get adFormat(): string {
    return this.effectiveVariant === 'horizontal' ? 'horizontal' : 'auto';
  }

  private loadTimer: ReturnType<typeof setTimeout> | null = null;
  private loaded = false;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.effectiveVariant = this.responsiveRail
      ? window.innerWidth < 768
        ? 'horizontal'
        : 'vertical'
      : this.variant;
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
      // AdSense unavailable
    }
  }
}
