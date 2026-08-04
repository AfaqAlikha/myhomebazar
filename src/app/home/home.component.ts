import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgFor, NgIf, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { HeroSwiperComponent } from '../shared/components/hero-swiper/hero-swiper.component';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { CategoryLinksComponent } from '../shared/category-links/category-links.component';
import {
  LocationFilterComponent,
  LocationFilters,
} from '../shared/location-filter/location-filter.component';

import {
  ProductSearchFilterComponent,
  ProductSearchFilters,
} from '../shared/product-search-filter/product-search-filter.component';

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
    ProductSearchFilterComponent,
    GoogleAdComponent,
    NgFor,
    NgIf,
    NgClass,
    MatIconModule,
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
  productSearchFilters: ProductSearchFilters = {
    search: '',
    categoryId: '',
    subCategoryId: '',
    sort: '',
  };
  viewportTier: ViewportTier = 'desktop';
  gridPreferences: GridPreferences = {
    mobile: 2,
    tablet: 3,
    desktop: 4,
  };

  private readonly gridStorageKey = 'myhomebazar.homeGridPreferences';
  private readonly gridOptionsByTier: Record<ViewportTier, number[]> = {
    mobile: [1, 2],
    tablet: [2, 3],
    desktop: [3, 4],
  };
  private readonly gridIconByColumns: Record<number, string> = {
    1: 'view_agenda',
    2: 'view_column',
    3: 'view_comfy',
    4: 'grid_view',
  };

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
    this.syncViewport();
    this.loadGridPreference();
    this.loadHomeProducts();
    this.loadFeaturedProducts();
  }

  get effectiveGridColumns(): number {
    const preferred = this.gridPreferences[this.viewportTier];
    const options = this.gridOptionsByTier[this.viewportTier];
    return options.includes(preferred) ? preferred : options[options.length - 1];
  }

  get gridLayoutIcon(): string {
    return this.gridIconByColumns[this.effectiveGridColumns] || 'grid_view';
  }

  get gridLayoutLabel(): string {
    const options = this.gridOptionsByTier[this.viewportTier];
    const currentIndex = options.indexOf(this.effectiveGridColumns);
    const next = options[(currentIndex + 1) % options.length];
    return `Current ${this.effectiveGridColumns} cards per row. Switch to ${next}.`;
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

  cycleGridLayout(): void {
    const options = this.gridOptionsByTier[this.viewportTier];
    const currentIndex = options.indexOf(this.effectiveGridColumns);
    const next = options[(currentIndex + 1) % options.length];
    this.gridPreferences = {
      ...this.gridPreferences,
      [this.viewportTier]: next,
    };
    this.saveGridPreferences();
  }

  private saveGridPreferences(): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.gridStorageKey, JSON.stringify(this.gridPreferences));
  }

  private loadGridPreference(): void {
    if (!this.isBrowser) return;

    try {
      const saved = JSON.parse(localStorage.getItem(this.gridStorageKey) || '{}') as Partial<GridPreferences>;
      this.gridPreferences = {
        mobile:
          saved.mobile && this.gridOptionsByTier.mobile.includes(saved.mobile) ? saved.mobile : 2,
        tablet:
          saved.tablet && this.gridOptionsByTier.tablet.includes(saved.tablet) ? saved.tablet : 3,
        desktop:
          saved.desktop && this.gridOptionsByTier.desktop.includes(saved.desktop)
            ? saved.desktop
            : 4,
      };
    } catch {
      this.gridPreferences = { mobile: 2, tablet: 3, desktop: 4 };
    }
  }

  private syncViewport(): void {
    if (!this.isBrowser) return;
    this.viewportTier = this.getViewportTier();
  }

  private getViewportTier(): ViewportTier {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 768) return 'tablet';
    return 'desktop';
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncViewport();
  }

  loadMoreProducts(): void {
    if (!this.isBrowser || this.isLoading || this.loadingMore || !this.hasMore) return;
    this.page += 1;
    this.loadHomeProducts(true);
  }

  onLocationFilter(filters: LocationFilters): void {
    this.locationFilters = filters;
    this.resetProductsAndReload();
  }

  onProductSearchFilter(filters: ProductSearchFilters): void {
    this.productSearchFilters = filters;
    this.resetProductsAndReload();
  }

  private resetProductsAndReload(): void {
    this.page = 1;
    this.hasMore = true;
    this.loadHomeProducts(false);
  }

  private buildProductQuery() {
    return {
      country: this.locationFilters.country,
      state: this.locationFilters.state,
      city: this.locationFilters.city,
      search: this.productSearchFilters.search,
      category: this.productSearchFilters.categoryId,
      subCategory: this.productSearchFilters.subCategoryId,
      sort: this.productSearchFilters.sort,
    };
  }

  loadHomeProducts(append = false): void {
    if (append) {
      if (this.loadingMore || !this.hasMore) return;
      this.loadingMore = true;
    } else {
      this.isLoading = true;
      this.spinnerService.show();
    }

    this.productService.getHomeProducts(this.page, this.buildProductQuery()).subscribe({
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
      },
      error: () => {
        this.heroLoading = false;
      },
    });
  }
}

type ViewportTier = 'mobile' | 'tablet' | 'desktop';

interface GridPreferences {
  mobile: number;
  tablet: number;
  desktop: number;
}
