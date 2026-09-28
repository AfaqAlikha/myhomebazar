import { Component, Input } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  Hero3dBannerComponent,
  Hero3dSlide,
  HeroVisualVariant,
} from '../../shared/components/hero-3d-banner/hero-3d-banner.component';
import { Promo3dCardComponent } from '../../shared/components/promo-3d-card/promo-3d-card.component';

export type HomeHeroLayoutId =
  | 'bento-classic'
  | 'stack-minimal'
  | 'bento-tilt'
  | 'bento-cube'
  | 'bento-depth';

export interface HomeHeroCopy {
  badge: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
}

@Component({
  selector: 'app-home-hero-section',
  standalone: true,
  imports: [NgClass, NgIf, RouterLink, Hero3dBannerComponent, Promo3dCardComponent],
  templateUrl: './home-hero-section.component.html',
  styleUrl: './home-hero-section.component.css',
})
export class HomeHeroSectionComponent {
  @Input({ required: true }) layout: HomeHeroLayoutId = 'bento-classic';
  @Input() slides: Hero3dSlide[] = [];
  @Input() loading = false;
  @Input({ required: true }) desktopCopy!: HomeHeroCopy;
  @Input({ required: true }) mobileCopy!: HomeHeroCopy;
  @Input({ required: true }) flashDealsCopy!: HomeHeroCopy;
  @Input({ required: true }) freeDeliveryCopy!: HomeHeroCopy;
  @Input() flashCountdown: { hours: string; minutes: string; seconds: string } | null = null;
  @Input() flashDealsActive = true;
  @Input() freeDeliveryActive = true;

  get visualVariant(): HeroVisualVariant {
    switch (this.layout) {
      case 'stack-minimal':
        return 'minimal';
      case 'bento-classic':
        return 'clean';
      case 'bento-tilt':
        return 'tilt';
      case 'bento-cube':
        return 'cube';
      case 'bento-depth':
        return 'depth';
      default:
        return 'clean';
    }
  }

  get layoutClass(): string {
    return `home-hero-section--${this.layout}`;
  }
}
