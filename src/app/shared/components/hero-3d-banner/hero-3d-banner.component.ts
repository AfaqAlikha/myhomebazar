import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { NgIf, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export type HeroVisualVariant = 'tilt' | 'cube' | 'depth' | 'clean' | 'minimal';

export interface Hero3dSlide {
  bannerImage?: string;
  image?: string;
  images?: string[];
  name?: string;
  bannerType?: string;
  _id?: string;
  link?: string;
}

@Component({
  selector: 'app-hero-3d-banner',
  standalone: true,
  imports: [NgIf, NgTemplateOutlet, RouterLink, MatIconModule],
  templateUrl: './hero-3d-banner.component.html',
  styleUrl: './hero-3d-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero3dBannerComponent implements OnChanges, OnDestroy {
  @Input() slides: Hero3dSlide[] = [];
  @Input() loading = false;
  @Input() variant: HeroVisualVariant = 'tilt';

  activeIndex = 0;
  tiltX = 0;
  tiltY = 0;

  private autoplayTimer?: ReturnType<typeof setInterval>;
  private readonly isBrowser: boolean;
  private readonly prefersReducedMotion: boolean;
  private tiltRaf = 0;

  readonly floatIcons = [
    { icon: 'weekend', delay: '0s' },
    { icon: 'lightbulb', delay: '0.8s' },
    { icon: 'kitchen', delay: '1.6s' },
    { icon: 'home', delay: '2.4s' },
  ];

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.prefersReducedMotion =
      this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slides'] || changes['loading']) {
      this.activeIndex = 0;
      this.setupAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoplay();
    if (this.tiltRaf) cancelAnimationFrame(this.tiltRaf);
  }

  get normalizedSlides(): Hero3dSlide[] {
    if (this.slides.length) return this.slides;
    return [{ bannerType: 'fallback' }];
  }

  get showHeavyEffects(): boolean {
    if (this.prefersReducedMotion) return false;
    return this.variant === 'tilt' || this.variant === 'cube' || this.variant === 'depth';
  }

  get enableTilt(): boolean {
    return this.showHeavyEffects && this.variant === 'tilt' && this.isBrowser;
  }

  slideImage(slide: Hero3dSlide): string {
    return slide.bannerImage || slide.image || slide.images?.[0] || '';
  }

  slideLink(slide: Hero3dSlide): string | null {
    if (slide.bannerType === 'product' && slide._id) {
      return `/product/details/${slide._id}`;
    }
    if (slide.link) return slide.link;
    return null;
  }

  frameTransform(): string {
    if (!this.enableTilt) return 'none';
    return `rotateX(${this.tiltX}deg) rotateY(${this.tiltY}deg)`;
  }

  isSlideVisible(index: number): boolean {
    const len = this.normalizedSlides.length;
    if (len <= 1) return index === 0;
    const prev = (this.activeIndex - 1 + len) % len;
    const next = (this.activeIndex + 1) % len;
    return index === this.activeIndex || index === prev || index === next;
  }

  slideTrackId(index: number, slide: Hero3dSlide): string {
    return slide._id || slideImageKey(slide) || String(index);
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.enableTilt) return;
    const { clientX, clientY, currentTarget } = event;
    if (this.tiltRaf) cancelAnimationFrame(this.tiltRaf);
    this.tiltRaf = requestAnimationFrame(() => {
      const target = currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width - 0.5;
      const py = (clientY - rect.top) / rect.height - 0.5;
      this.tiltY = px * 8;
      this.tiltX = -py * 6;
      this.cdr.markForCheck();
    });
  }

  onMouseLeave(): void {
    this.tiltX = 0;
    this.tiltY = 0;
    this.cdr.markForCheck();
  }

  goTo(index: number): void {
    if (!this.normalizedSlides.length) return;
    this.activeIndex =
      ((index % this.normalizedSlides.length) + this.normalizedSlides.length) %
      this.normalizedSlides.length;
    this.setupAutoplay();
    this.cdr.markForCheck();
  }

  next(): void {
    this.goTo(this.activeIndex + 1);
  }

  prev(): void {
    this.goTo(this.activeIndex - 1);
  }

  imageLoading(index: number): 'eager' | 'lazy' {
    return index === this.activeIndex ? 'eager' : 'lazy';
  }

  private setupAutoplay(): void {
    this.clearAutoplay();
    if (
      !this.isBrowser ||
      this.loading ||
      this.prefersReducedMotion ||
      this.normalizedSlides.length <= 1
    ) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.autoplayTimer = setInterval(() => {
        this.ngZone.run(() => {
          this.next();
        });
      }, 5500);
    });
  }

  private clearAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }
}

function slideImageKey(slide: Hero3dSlide): string {
  return slide.bannerImage || slide.image || slide.images?.[0] || '';
}
