import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { HeroSwiperComponent } from '../shared/components/hero-swiper/hero-swiper.component';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { CategoryLinksComponent } from '../shared/category-links/category-links.component';
import {
  LocationFilterComponent,
  LocationFilters,
} from '../shared/location-filter/location-filter.component';

import { NgFor, NgIf } from '@angular/common';
import { ProductService } from '../services/product.service';
import { SpinnerService } from '../shared/spinner.service';
import { SeoService } from '../services/seo';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSwiperComponent,
    CategoryLinksComponent,
    ProductCardComponent,
    LocationFilterComponent,
    NgFor,
    MatIconModule,
    NgIf,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  featured: any[] = [];
  products: any[] = [];
  page = 1;

  totalItems = 0;
  itemsPerPage = 0;
  isLoading = true;
  loadingMore = false;
  hasMore = true;
  heroLoading = true;

  locationFilters: LocationFilters = { country: '', state: '', city: '' };
  showScrollDown = true;
  showScrollUp = false;

  private readonly isBrowser: boolean;

  constructor(
    private productService: ProductService,
    private spinnerService: SpinnerService,
    private seo: SeoService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.setDefaultSeo();
    this.loadHomeProducts();
    this.loadFeaturedProducts();
    if (this.isBrowser) {
      setTimeout(() => this.updateScrollButtons(), 0);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollButtons();
    this.tryLoadMoreOnScroll();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateScrollButtons();
  }

  scrollToBottom(): void {
    if (!this.isBrowser) return;
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  }

  scrollToTop(): void {
    if (!this.isBrowser) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateScrollButtons(): void {
    if (!this.isBrowser) return;

    const el = document.documentElement;
    const scrollTop = el.scrollTop;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    const nearBottom = scrollTop >= maxScroll - 120;

    this.showScrollDown = !nearBottom;
    this.showScrollUp = nearBottom;
  }

  private tryLoadMoreOnScroll(): void {
    if (!this.isBrowser || this.isLoading || this.loadingMore || !this.hasMore) return;

    const el = document.documentElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 320;

    if (nearBottom) {
      this.page += 1;
      this.loadHomeProducts(true);
    }
  }

  onLocationFilter(filters: LocationFilters): void {
    this.locationFilters = filters;
    this.page = 1;
    this.hasMore = true;
    this.loadHomeProducts(false);
  }

  loadHomeProducts(append = false): void {
    if (append) {
      if (this.loadingMore || !this.hasMore) return;
      this.loadingMore = true;
    } else {
      this.isLoading = true;
      this.spinnerService.show();
    }

    this.productService.getHomeProducts(this.page, this.locationFilters).subscribe({
      next: (res: any) => {
        const incoming = res.products || [];
        this.products = append ? [...this.products, ...incoming] : incoming;
        this.totalItems = res.pagination.totalItems;
        this.itemsPerPage = res.pagination.itemsPerPage;
        this.page = res.pagination.currentPage;
        this.hasMore = this.page < res.pagination.totalPages;
        this.isLoading = false;
        this.loadingMore = false;
        this.spinnerService.hide();
        setTimeout(() => this.updateScrollButtons(), 0);
      },
      error: () => {
        if (append && this.page > 1) this.page -= 1;
        this.isLoading = false;
        this.loadingMore = false;
        this.spinnerService.hide();
      },
    });
  }

  loadFeaturedProducts(): void {
    this.heroLoading = true;

    this.productService.getFeaturedProducts().subscribe({
      next: (res: any) => {
        const banners = res.banners || [];

        const productBanners: any[] = [];
        const imageBanners: any[] = [];

        banners.forEach((banner: any) => {
          if (banner.productId) {
            productBanners.push({
              ...banner.productId,
              bannerType: 'product',
              bannerImage: banner.productId.images?.[0],
            });
          } else {
            banner.images?.forEach((img: string) => {
              imageBanners.push({
                bannerType: 'image',
                bannerImage: img,
              });
            });
          }
        });

        this.featured = [...productBanners, ...imageBanners];
        this.heroLoading = false;
        setTimeout(() => this.updateScrollButtons(), 100);
      },
      error: () => {
        this.heroLoading = false;
      },
    });
  }
}
