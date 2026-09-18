import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
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

export interface HomePageData {
  hero: HomePromoTile & { slides: HomeHeroSlide[] };
  flashDeals: HomePromoTile;
  freeDelivery: HomePromoTile;
  mobileHero: HomePromoTile & { slides: HomeHeroSlide[] };
  sections: {
    popularTitle: string;
    desktopProductsTitle: string;
    categoriesTitle: string;
  };
  categories: HomeCategoryChip[];
}

@Injectable({ providedIn: 'root' })
export class HomePageService {
  private cache$?: Observable<{ success: boolean; data: HomePageData }>;

  constructor(private readonly http: HttpClient) {}

  getPublicHome(): Observable<{ success: boolean; data: HomePageData }> {
    if (!this.cache$) {
      this.cache$ = this.http
        .get<{ success: boolean; data: HomePageData }>(API_ENDPOINTS.home.public)
        .pipe(shareReplay(1));
    }
    return this.cache$;
  }
}
