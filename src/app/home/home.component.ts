import { Component, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { HeroSwiperComponent } from '../shared/components/hero-swiper/hero-swiper.component';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { CategoryLinksComponent } from '../shared/category-links/category-links.component';
import {
  LocationFilterComponent,
  LocationFilters,
} from '../shared/location-filter/location-filter.component';

import { NgFor, NgIf, NgClass } from '@angular/common';
import { ProductService } from '../services/product.service';
import { SpinnerService } from '../shared/spinner.service';
import { SeoService } from '../services/seo';
import { GoogleAdComponent } from '../shared/google-ad/google-ad.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSwiperComponent,
    CategoryLinksComponent,
    ProductCardComponent,
    LocationFilterComponent,
    GoogleAdComponent,
    NgFor,
    MatIconModule,
    NgIf,
    NgClass,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
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
  gridColumns = 4;
  isMobileViewport = false;

  readonly mobileGridOptions = [1, 2];
  readonly desktopGridOptions = [1, 2, 3, 4];
  private readonly gridStorageKey = 'myhomebazar.homeGridColumns';

  private readonly isBrowser: boolean;
  private scrollTick = false;

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
    this.syncViewport();
    this.loadGridPreference();
    this.loadHomeProducts();
    this.loadFeaturedProducts();
    if (this.isBrowser) {
      setTimeout(() => this.updateScrollButtons(), 0);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  get gridOptions(): number[] {
    return this.isMobileViewport ? this.mobileGridOptions : this.desktopGridOptions;
  }

  get effectiveGridColumns(): number {
    if (this.isMobileViewport) {
      return Math.min(this.gridColumns, 2);
    }
    return this.gridColumns;
  }

  get productGridClass(): string {
    const map: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    };
    return map[this.effectiveGridColumns] || 'grid-cols-1';
  }

  setGridColumns(columns: number): void {
    this.gridColumns = columns;
    if (this.isBrowser) {
      localStorage.setItem(this.gridStorageKey, String(columns));
    }
  }

  private loadGridPreference(): void {
    if (!this.isBrowser) return;

    const saved = Number(localStorage.getItem(this.gridStorageKey));
    if ([1, 2, 3, 4].includes(saved)) {
      this.gridColumns = saved;
    }
  }

  private syncViewport(): void {
    if (!this.isBrowser) return;
    this.isMobileViewport = window.innerWidth < 768;
    if (this.isMobileViewport && this.gridColumns > 2) {
      this.gridColumns = 2;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.scrollTick) return;
    this.scrollTick = true;
    requestAnimationFrame(() => {
      this.updateScrollButtons();
      this.tryLoadMoreOnScroll();
      this.scrollTick = false;
    });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncViewport();
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
