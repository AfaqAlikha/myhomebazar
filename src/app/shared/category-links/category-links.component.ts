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
import { NgFor, NgIf, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import { CategoryService, Category } from '../../services/category.service';

@Component({
  selector: 'app-category-links',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './category-links.component.html',
  styleUrls: ['./category-links.component.css'],
})
export class CategoryLinksComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('swiperEl') swiperEl!: ElementRef<HTMLDivElement>;
  @ViewChild('prevBtn') prevBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('nextBtn') nextBtn!: ElementRef<HTMLButtonElement>;

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
        this.scheduleSwiperInit();
      },
      error: (err) => console.error(err),
    });
  }

  ngAfterViewInit(): void {
    this.scheduleSwiperInit();
  }

  ngOnDestroy(): void {
    this.swiper?.destroy(true, true);
  }

  private scheduleSwiperInit(): void {
    if (!this.isBrowser || !this.categories.length) return;
    setTimeout(() => this.initSwiper(), 0);
  }

  private initSwiper(): void {
    if (
      !this.isBrowser ||
      !this.swiperEl?.nativeElement ||
      !this.prevBtn?.nativeElement ||
      !this.nextBtn?.nativeElement ||
      !this.categories.length
    ) {
      return;
    }

    this.swiper?.destroy(true, true);

    this.swiper = new Swiper(this.swiperEl.nativeElement, {
      modules: [Navigation],
      slidesPerView: 'auto',
      slidesPerGroup: 1,
      spaceBetween: 12,
      speed: 300,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      grabCursor: true,
      resistanceRatio: 0.85,
      navigation: {
        nextEl: this.nextBtn.nativeElement,
        prevEl: this.prevBtn.nativeElement,
      },
      breakpoints: {
        0: { spaceBetween: 10 },
        640: { spaceBetween: 12 },
      },
    });

    requestAnimationFrame(() => this.swiper?.update());
  }
}
