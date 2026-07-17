import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NgIf, NgFor, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay, Keyboard, EffectFade } from 'swiper/modules';

@Component({
  selector: 'app-hero-swiper',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
  templateUrl: './hero-swiper.component.html',
  styleUrls: ['./hero-swiper.component.css'],
})
export class HeroSwiperComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() slides: any[] = [];
  @Input() loading = false;

  @ViewChild('swiper') swiperElement!: ElementRef<HTMLDivElement>;

  private swiper?: Swiper;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isBrowser) return;
    if (changes['slides'] || changes['loading']) {
      this.scheduleInit();
    }
  }

  ngAfterViewInit(): void {
    this.scheduleInit();
  }

  ngOnDestroy(): void {
    this.swiper?.destroy(true, true);
  }

  private scheduleInit(): void {
    if (!this.isBrowser || this.loading || !this.slides.length) return;
    setTimeout(() => this.reinitSwiper(), 50);
  }

  private reinitSwiper(): void {
    if (!this.swiperElement?.nativeElement || !this.slides.length) return;

    this.swiper?.destroy(true, true);

    this.swiper = new Swiper(this.swiperElement.nativeElement, {
      modules: [Navigation, Pagination, Autoplay, Keyboard, EffectFade],
      slidesPerView: 1,
      loop: this.slides.length > 1,
      speed: 700,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      autoplay:
        this.slides.length > 1
          ? {
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }
          : false,
      navigation: {
        nextEl: '.hero-next',
        prevEl: '.hero-prev',
      },
      pagination: {
        el: '.hero-pagination',
        clickable: true,
      },
      keyboard: { enabled: true },
      observer: true,
      observeParents: true,
      watchOverflow: true,
    });

    if (this.slides.length > 1) {
      this.swiper.autoplay?.start();
    }
  }
}
