import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';

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
  endAt?: string;
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

export interface HomePageData {
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

@Injectable({ providedIn: 'root' })
export class HomePageService {
  private cache$?: Observable<HomePageData>;

  constructor(private readonly http: HttpClient) {}

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
    if (!this.cache$) {
      this.cache$ = this.http
        .get<HomePageData | { success: boolean; data: HomePageData }>(API_ENDPOINTS.home.public)
        .pipe(
          map((res) => this.normalizeHomePayload(res)),
          shareReplay(1),
        );
    }
    return this.cache$;
  }
}
