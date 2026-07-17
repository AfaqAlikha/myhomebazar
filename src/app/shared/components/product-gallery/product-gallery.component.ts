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
import Swiper from 'swiper';
import { Navigation, Thumbs, Zoom, Keyboard } from 'swiper/modules';

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './product-gallery.component.html',
  styleUrls: ['./product-gallery.component.css'],
})
export class ProductGalleryComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() images: string[] = [];
  @Input() productName = 'Product';

  @ViewChild('mainSwiper') mainSwiperEl!: ElementRef<HTMLDivElement>;
  @ViewChild('thumbsSwiper') thumbsSwiperEl!: ElementRef<HTMLDivElement>;

  private mainSwiper?: Swiper;
  private thumbsSwiper?: Swiper;
  private isBrowser: boolean;
  lightboxOpen = false;
  lightboxIndex = 0;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] && !changes['images'].firstChange && this.isBrowser) {
      this.destroySwipers();
      setTimeout(() => this.initSwipers(), 0);
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && this.images?.length) {
      this.initSwipers();
    }
  }

  ngOnDestroy(): void {
    this.destroySwipers();
  }

  get displayImages(): string[] {
    return this.images?.length ? this.images : ['/assets/placeholder-product.png'];
  }

  openLightbox(index: number): void {
    if (!this.isBrowser) return;
    this.lightboxIndex = index;
    this.lightboxOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  lightboxPrev(): void {
    this.lightboxIndex =
      (this.lightboxIndex - 1 + this.displayImages.length) % this.displayImages.length;
  }

  lightboxNext(): void {
    this.lightboxIndex = (this.lightboxIndex + 1) % this.displayImages.length;
  }

  private initSwipers(): void {
    if (!this.displayImages.length) return;

    this.thumbsSwiper = new Swiper(this.thumbsSwiperEl.nativeElement, {
      modules: [Navigation],
      spaceBetween: 8,
      slidesPerView: 4,
      freeMode: true,
      watchSlidesProgress: true,
      breakpoints: {
        768: { slidesPerView: 5 },
      },
    });

    this.mainSwiper = new Swiper(this.mainSwiperEl.nativeElement, {
      modules: [Navigation, Thumbs, Zoom, Keyboard],
      spaceBetween: 10,
      navigation: {
        nextEl: '.gallery-next',
        prevEl: '.gallery-prev',
      },
      thumbs: { swiper: this.thumbsSwiper },
      zoom: { maxRatio: 3 },
      keyboard: { enabled: true },
    });
  }

  private destroySwipers(): void {
    this.mainSwiper?.destroy(true, true);
    this.thumbsSwiper?.destroy(true, true);
    this.mainSwiper = undefined;
    this.thumbsSwiper = undefined;
  }
}
