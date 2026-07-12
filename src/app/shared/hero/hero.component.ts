import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
} from '@angular/core';

import { NgIf, isPlatformBrowser, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [NgIf, RouterLink,NgFor],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
})
export class HomeHeroComponent implements AfterViewInit, OnDestroy {
  @Input() featured: any[] = [];

  @ViewChild('swiper', { static: false })
  swiperElement!: ElementRef<HTMLDivElement>;

  private swiper?: Swiper;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.featured?.length) {
      return;
    }

    this.swiper = new Swiper(this.swiperElement.nativeElement, {
      modules: [Navigation, Pagination, Autoplay],

      slidesPerView: 1,

      loop: this.featured.length > 1,

      speed: 700,

      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },

      navigation: {
        nextEl: '.hero-next',
        prevEl: '.hero-prev',
      },

      pagination: {
        el: '.hero-pagination',
        clickable: true,
      },

      observer: true,
      observeParents: true,
      watchOverflow: true,
    });
  }

  ngOnDestroy(): void {
    this.swiper?.destroy(true, true);
  }

  getDiscount(slide: any): number {
    if (slide?.promotion?.isActive) {
      return slide.promotion.discountPercent;
    }

    if (!slide?.discountPrice) {
      return 0;
    }

    return Math.round(((slide.price - slide.discountPrice) / slide.price) * 100);
  }
}
