import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { NgFor, NgIf, NgStyle, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import { CategoryService, Category } from '../../services/category.service';

@Component({
  selector: 'app-category-links',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive, NgStyle, MatIconModule],
  templateUrl: './category-links.component.html',
  styleUrls: ['./category-links.component.css'],
})
export class CategoryLinksComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('swiperEl') swiperEl!: ElementRef<HTMLDivElement>;

  categories: Category[] = [];
  private swiper?: Swiper;
  private readonly isBrowser: boolean;

  constructor(
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res;
        if (this.isBrowser) {
          setTimeout(() => this.initSwiper(), 0);
        }
      },
      error: (err) => console.error(err),
    });
  }

  ngAfterViewInit(): void {
    if (this.categories.length) {
      this.initSwiper();
    }
  }

  ngOnDestroy(): void {
    this.swiper?.destroy(true, true);
  }

  private initSwiper(): void {
    if (!this.isBrowser || !this.swiperEl?.nativeElement || !this.categories.length) return;

    this.swiper?.destroy(true, true);

    this.swiper = new Swiper(this.swiperEl.nativeElement, {
      modules: [Navigation],
      slidesPerView: 2.3,
      spaceBetween: 16,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      navigation: {
        nextEl: '.category-swiper-next',
        prevEl: '.category-swiper-prev',
      },
      breakpoints: {
        480: { slidesPerView: 3.3 },
        640: { slidesPerView: 4.3 },
        768: { slidesPerView: 5.3 },
        1024: { slidesPerView: 6.3 },
        1280: { slidesPerView: 7.3 },
      },
    });
  }
}
