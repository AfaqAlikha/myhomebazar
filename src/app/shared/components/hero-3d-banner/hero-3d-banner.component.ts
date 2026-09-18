import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { NgIf, NgFor, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

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
  imports: [NgIf, NgFor, NgTemplateOutlet, RouterLink, MatIconModule],
  templateUrl: './hero-3d-banner.component.html',
  styleUrl: './hero-3d-banner.component.css',
})
export class Hero3dBannerComponent implements OnChanges, OnDestroy {
  @Input() slides: Hero3dSlide[] = [];
  @Input() loading = false;

  activeIndex = 0;
  tiltX = 0;
  tiltY = 0;

  private autoplayTimer?: ReturnType<typeof setInterval>;
  private readonly isBrowser: boolean;

  readonly floatIcons = [
    { icon: 'weekend', delay: '0s' },
    { icon: 'lightbulb', delay: '0.8s' },
    { icon: 'kitchen', delay: '1.6s' },
    { icon: 'home', delay: '2.4s' },
  ];

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slides'] || changes['loading']) {
      this.activeIndex = 0;
      this.setupAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoplay();
  }

  get normalizedSlides(): Hero3dSlide[] {
    if (this.slides.length) return this.slides;
    return [{ bannerType: 'fallback' }];
  }

  get currentSlide(): Hero3dSlide {
    return this.normalizedSlides[this.activeIndex] || this.normalizedSlides[0];
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
    return `rotateX(${this.tiltX}deg) rotateY(${this.tiltY}deg)`;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isBrowser) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    this.tiltY = px * 10;
    this.tiltX = -py * 8;
  }

  onMouseLeave(): void {
    this.tiltX = 0;
    this.tiltY = 0;
  }

  goTo(index: number): void {
    if (!this.normalizedSlides.length) return;
    this.activeIndex = ((index % this.normalizedSlides.length) + this.normalizedSlides.length) % this.normalizedSlides.length;
    this.setupAutoplay();
  }

  next(): void {
    this.goTo(this.activeIndex + 1);
  }

  prev(): void {
    this.goTo(this.activeIndex - 1);
  }

  private setupAutoplay(): void {
    this.clearAutoplay();
    if (!this.isBrowser || this.loading || this.normalizedSlides.length <= 1) return;

    this.autoplayTimer = setInterval(() => {
      this.next();
    }, 5500);
  }

  private clearAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }
}
