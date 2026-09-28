import { Inject, Injectable, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, shareReplay, tap } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import {
  CACHE_KEYS,
  CACHE_TTL,
  readPublicCache,
  writePublicCache,
} from '../utils/public-cache';

export interface HomeHeroSlide {
  type: 'product' | 'image';
  image: string;
  title?: string;
  productId?: string;
  link?: string;
}

export interface HomePromoTile {
  badge: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  isActive?: boolean;
  endAt?: string | null;
  countdownSource?: 'manual' | 'promotion' | null;
  activeDealCount?: number;
  threshold?: number;
  message?: string;
}

export interface HomeCategoryChip {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  color?: string;
}

export interface HomeProductPreview {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  price: number;
  catName?: string;
  averageRating?: number;
  reviewCount?: number;
  isPromoted?: boolean;
  promotionExpiresAt?: string | Date | null;
  promotionLabel?: string;
  likeCount?: number;
  viewCount?: number;
  user?: string | { _id?: string; id?: string };
}

export type HomeHeroLayoutId =
  | 'bento-classic'
  | 'stack-minimal'
  | 'bento-tilt'
  | 'bento-cube'
  | 'bento-depth';

export interface HomePageData {
  heroLayout?: {
    desktop: HomeHeroLayoutId;
    mobile: HomeHeroLayoutId;
    promoGridDesktop?: number;
    promoGridMobile?: number;
  };
  hero: HomePromoTile & { slides: HomeHeroSlide[] };
  flashDeals: HomePromoTile;
  freeDelivery: HomePromoTile;
  mobileHero: HomePromoTile & { slides: HomeHeroSlide[] };
  sections: {
    popularTitle: string;
    dealsTitle: string;
    desktopProductsTitle: string;
    categoriesTitle: string;
    trendingTitle: string;
  };
  categories: HomeCategoryChip[];
  flashDealProducts: HomeProductPreview[];
  popularProducts: HomeProductPreview[];
  trendingProducts: HomeProductPreview[];
}

const HOME_PUBLIC_STATE_KEY = makeStateKey<HomePageData>('home-public-data');

@Injectable({ providedIn: 'root' })
export class HomePageService {
  private homeMemory: HomePageData | null = null;
  private homeRequest: Observable<HomePageData> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly transferState: TransferState,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
  ) {}

  /** SSR returns `{ data }`; browser interceptor may unwrap to `HomePageData` directly. */
  private normalizeHomePayload(
    res: HomePageData | { success?: boolean; data?: HomePageData },
  ): HomePageData {
    if (res && typeof res === 'object' && 'data' in res && res.data) {
      return res.data;
    }
    return res as HomePageData;
  }

  getPublicHome(): Observable<HomePageData> {
    const transferred = this.transferState.get(HOME_PUBLIC_STATE_KEY, null);
    if (transferred) {
      this.transferState.remove(HOME_PUBLIC_STATE_KEY);
      this.homeMemory = transferred;
      return of(transferred);
    }

    const cached = this.homeMemory ?? readPublicCache<HomePageData>(CACHE_KEYS.HOME_PUBLIC);
    if (cached) {
      this.homeMemory = cached;
      return of(cached);
    }

    if (!this.homeRequest) {
      this.homeRequest = this.http
        .get<HomePageData | { success: boolean; data: HomePageData }>(API_ENDPOINTS.home.public)
        .pipe(
          map((res) => this.normalizeHomePayload(res)),
          tap((data) => {
            this.homeMemory = data;
            writePublicCache(CACHE_KEYS.HOME_PUBLIC, data, CACHE_TTL.HOME_PUBLIC_MS);
            if (isPlatformServer(this.platformId)) {
              this.transferState.set(HOME_PUBLIC_STATE_KEY, data);
            }
          }),
          shareReplay(1),
        );
    }

    return this.homeRequest;
  }
}
