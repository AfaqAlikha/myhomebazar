import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser, NgClass, NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { forkJoin, interval, Subscription } from 'rxjs';

import { Hero3dBannerComponent, Hero3dSlide } from '../shared/components/hero-3d-banner/hero-3d-banner.component';
import { Promo3dCardComponent } from '../shared/components/promo-3d-card/promo-3d-card.component';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { CategoryChipsComponent } from '../shared/category-chips/category-chips.component';

import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { SeoService } from '../services/seo';
import { GoogleAdComponent } from '../shared/google-ad/google-ad.component';
import {
  HomeCategoryChip,
  HomePageData,
  HomePageService,
  HomeProductPreview,
} from '../core/services/home-page.service';
import { HeaderProductSearchService } from '../core/services/header-product-search.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    Hero3dBannerComponent,
    Promo3dCardComponent,
    CategoryChipsComponent,
    ProductCardComponent,
    GoogleAdComponent,
    NgFor,
    NgIf,
    NgClass,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly headerSearch = inject(HeaderProductSearchService);

  featured: Hero3dSlide[] = [];
  heroSlides: Hero3dSlide[] = [];
  products: any[] = [];
  page = 1;
  homeData: HomePageData | null = null;
  displayCategories: HomeCategoryChip[] = [];
  flashDealProducts: HomeProductPreview[] = [];
  popularProducts: HomeProductPreview[] = [];
  trendingProducts: HomeProductPreview[] = [];
  homeConfigLoading = true;
  sectionsLoading = false;

  totalItems = 0;
  itemsPerPage = 0;
  isLoading = true;
  loadingMore = false;
  hasMore = true;
  heroSlidesLoading = true;
  flashCountdown: { hours: string; minutes: string; seconds: string } | null = null;

  selectedCategoryId = '';
  searchQuery = '';

  private defaultFlashDealProducts: HomeProductPreview[] = [];
  private defaultPopularProducts: HomeProductPreview[] = [];
  private defaultTrendingProducts: HomeProductPreview[] = [];
  private sectionRequestId = 0;
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
  private countdownSub?: Subscription;
  private flashEndAt: Date | null = null;
  private homeConfigRequestId = 0;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private homePageService: HomePageService,
    private seo: SeoService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.setDefaultSeo();
    this.syncViewport();
    this.loadGridPreference();
    this.searchQuery = this.headerSearch.getQuery('home');
    this.headerSearch.bindPageSearch(this.destroyRef, 'home', (query) => {
      if (this.searchQuery === query) return;
      this.searchQuery = query;
      this.applyProductFilters();
    });

    if (this.hasActiveProductFilters()) {
      this.reloadHomeSections();
    }

    this.loadHomeConfig();
    this.loadHomeProducts();
    this.loadFeaturedProducts();
  }

  ngOnDestroy(): void {
    this.countdownSub?.unsubscribe();
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

  get heroDesktopCopy() {
    const hero = this.homeData?.hero;
    return {
      badge: this.heroText(hero?.badge, 'New Season'),
      title: this.heroText(hero?.title, 'Summer Collection'),
      subtitle: this.heroText(
        hero?.subtitle,
        'Discover curated home & living picks for every space.',
      ),
      ctaLabel: this.heroText(hero?.ctaLabel, 'Shop Now'),
      ctaLink: this.heroText(hero?.ctaLink, '/shop'),
    };
  }

  get heroMobileCopy() {
    const hero = this.homeData?.mobileHero;
    return {
      badge: this.heroText(hero?.badge, 'New Year, New Home'),
      title: this.heroText(hero?.title, 'New Year, New Home'),
      subtitle: this.heroText(
        hero?.subtitle,
        'Furniture & decor for every beautiful space.',
      ),
      ctaLabel: this.heroText(hero?.ctaLabel, 'Shop Now'),
      ctaLink: this.heroText(hero?.ctaLink, '/shop'),
    };
  }

  get flashDealsCopy() {
    const tile = this.homeData?.flashDeals;
    return {
      badge: this.heroText(tile?.badge, 'Flash Deals'),
      title: this.heroText(tile?.title, 'Limited Time Offers'),
      subtitle: this.heroText(tile?.subtitle, 'Curated drops with countdown badges.'),
      ctaLabel: this.heroText(tile?.ctaLabel, 'Browse deals'),
      ctaLink: this.heroText(tile?.ctaLink, '/deals'),
    };
  }

  get freeDeliveryCopy() {
    const tile = this.homeData?.freeDelivery;
    return {
      badge: this.heroText(tile?.badge, 'Free Delivery'),
      title: this.heroText(tile?.title, 'Platform shipping perks'),
      subtitle: this.heroText(
        tile?.message || tile?.subtitle,
        'Unlock free delivery on eligible orders.',
      ),
      ctaLabel: this.heroText(tile?.ctaLabel, 'Learn more'),
      ctaLink: this.heroText(tile?.ctaLink, '/free-delivery'),
    };
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
    this.gridPreferences = { ...this.gridPreferences, [this.viewportTier]: next };
    this.saveGridPreferences();
    this.cdr.markForCheck();
  }

  onCategoryChipSelect(categoryId: string): void {
    this.selectedCategoryId = categoryId || '';
    this.applyProductFilters();
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
        mobile: saved.mobile && this.gridOptionsByTier.mobile.includes(saved.mobile) ? saved.mobile : 2,
        tablet: saved.tablet && this.gridOptionsByTier.tablet.includes(saved.tablet) ? saved.tablet : 3,
        desktop: saved.desktop && this.gridOptionsByTier.desktop.includes(saved.desktop) ? saved.desktop : 4,
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
    this.cdr.markForCheck();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isBrowser || this.isLoading || this.loadingMore || !this.hasMore) return;
    const scrollPosition = window.innerHeight + window.scrollY;
    const bottom = document.documentElement.scrollHeight - 320;
    if (scrollPosition >= bottom) this.loadMoreProducts();
  }

  loadMoreProducts(): void {
    if (!this.isBrowser || this.isLoading || this.loadingMore || !this.hasMore) return;
    this.page += 1;
    this.loadHomeProducts(true);
  }

  private applyProductFilters(): void {
    this.reloadHomeSections();
    this.resetProductsAndReload();
  }

  private resetProductsAndReload(): void {
    this.page = 1;
    this.hasMore = true;
    this.loadHomeProducts(false);
  }

  private hasActiveProductFilters(): boolean {
    return Boolean(this.selectedCategoryId || this.searchQuery.trim());
  }

  private buildProductQuery() {
    return {
      search: this.searchQuery.trim(),
      category: this.selectedCategoryId,
    };
  }

  private reloadHomeSections(): void {
    if (!this.hasActiveProductFilters()) {
      this.flashDealProducts = [...this.defaultFlashDealProducts];
      this.popularProducts = [...this.defaultPopularProducts];
      this.trendingProducts = [...this.defaultTrendingProducts];
      this.cdr.markForCheck();
      return;
    }

    const requestId = ++this.sectionRequestId;
    const filters = this.buildProductQuery();
    this.sectionsLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      flash: this.productService.getProducts({
        ...filters,
        promoted: true,
        sort: 'deals',
        page: 1,
        limit: 8,
      }),
      popular: this.productService.getProducts({
        ...filters,
        sort: 'selling',
        page: 1,
        limit: 8,
      }),
      trending: this.productService.getProducts({
        ...filters,
        sort: 'selling',
        page: 1,
        limit: 4,
      }),
    }).subscribe({
      next: ({ flash, popular, trending }) => {
        if (requestId !== this.sectionRequestId) return;
        this.flashDealProducts = flash?.products || [];
        this.popularProducts = popular?.products || [];
        this.trendingProducts = trending?.products || [];
        this.sectionsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        if (requestId !== this.sectionRequestId) return;
        this.flashDealProducts = [];
        this.popularProducts = [];
        this.trendingProducts = [];
        this.sectionsLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private heroText(value: string | undefined | null, fallback: string): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : fallback;
  }

  private loadHomeConfig(): void {
    const requestId = ++this.homeConfigRequestId;
    this.homeConfigLoading = true;
    this.homePageService.getPublicHome().subscribe({
      next: (data) => {
        if (requestId !== this.homeConfigRequestId) return;
        this.homeData = data;
        this.syncHeroSlides();
        if (this.heroSlides.length) {
          this.heroSlidesLoading = false;
        }
        this.defaultFlashDealProducts = data?.flashDealProducts || [];
        this.defaultPopularProducts = data?.popularProducts || [];
        this.defaultTrendingProducts = data?.trendingProducts || [];
        if (!this.hasActiveProductFilters()) {
          this.flashDealProducts = [...this.defaultFlashDealProducts];
          this.popularProducts = [...this.defaultPopularProducts];
          this.trendingProducts = [...this.defaultTrendingProducts];
        }
        this.displayCategories = (data?.categories || []).slice(0, 8);
        if (this.displayCategories.length < 5) this.loadCategoriesFallback();
        this.applyFlashCountdown(data);
        this.homeConfigLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        if (requestId !== this.homeConfigRequestId) return;
        this.homeConfigLoading = false;
        this.loadCategoriesFallback();
        this.cdr.markForCheck();
      },
    });
  }

  private applyFlashCountdown(data: HomePageData): void {
    const end = this.resolveFlashCountdownEnd(data);
    this.resetFlashCountdown();
    if (!end) return;
    this.flashEndAt = end;
    this.updateCountdown();
    if (this.isBrowser) {
      this.startCountdown();
    }
  }

  private resolveFlashCountdownEnd(data: HomePageData): Date | null {
    const flashDeals = data?.flashDeals;
    const source = flashDeals?.countdownSource;
    if (source !== 'manual' && source !== 'promotion') return null;

    const endAt = flashDeals?.endAt;
    if (!endAt) return null;

    const end = new Date(endAt);
    return Number.isNaN(end.getTime()) ? null : end;
  }

  private loadCategoriesFallback(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        const mapped: HomeCategoryChip[] = (cats || []).slice(0, 8).map((cat) => ({
          _id: cat._id,
          name: cat.name,
          slug: cat.name?.toLowerCase?.().replace(/\s+/g, '-') || '',
          image: cat.images?.[0] || '',
          color: cat.color || '',
        }));
        if (mapped.length) this.displayCategories = mapped;
        this.cdr.markForCheck();
      },
    });
  }

  private resetFlashCountdown(): void {
    this.countdownSub?.unsubscribe();
    this.countdownSub = undefined;
    this.flashEndAt = null;
    this.flashCountdown = null;
  }

  private startCountdown(): void {
    this.countdownSub?.unsubscribe();
    if (!this.flashEndAt) return;
    this.countdownSub = interval(1000).subscribe(() => this.updateCountdown());
  }

  private updateCountdown(): void {
    if (!this.flashEndAt) return;
    const diff = this.flashEndAt.getTime() - Date.now();
    if (diff <= 0) {
      this.flashCountdown = null;
      this.countdownSub?.unsubscribe();
      this.countdownSub = undefined;
      this.cdr.markForCheck();
      return;
    }
    this.flashCountdown = {
      hours: String(Math.floor(diff / 3600000)).padStart(2, '0'),
      minutes: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
      seconds: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
    };
    this.cdr.markForCheck();
  }

  loadHomeProducts(append = false): void {
    if (append) {
      if (this.loadingMore || !this.hasMore) return;
      this.loadingMore = true;
    } else {
      this.isLoading = true;
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
        this.cdr.markForCheck();
      },
      error: () => {
        if (append && this.page > 1) this.page -= 1;
        this.isLoading = false;
        this.loadingMore = false;
        this.cdr.markForCheck();
      },
    });
  }

  private syncHeroSlides(): void {
    const apiSlides: Hero3dSlide[] = (this.homeData?.hero?.slides || []).map((slide) => ({
      bannerImage: slide.image,
      bannerType: slide.type,
      name: slide.title,
      link: slide.link,
      _id: slide.productId,
    }));

    this.heroSlides = apiSlides.length ? apiSlides : this.featured;
  }

  loadFeaturedProducts(): void {
    if (!this.heroSlides.length) {
      this.heroSlidesLoading = true;
    }
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
              imageBanners.push({ bannerType: 'image', bannerImage: img });
            });
          }
        });
        this.featured = [...productBanners, ...imageBanners];
        this.syncHeroSlides();
        this.heroSlidesLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.heroSlidesLoading = false;
        this.cdr.markForCheck();
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
