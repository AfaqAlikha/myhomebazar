import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { API_ENDPOINTS } from '../config/api-endpoints';
import {
  CACHE_KEYS,
  CACHE_TTL,
  readPublicCache,
  writePublicCache,
} from '../utils/public-cache';

export interface AppLogo {
  image: string;
  name?: string;
  siteName?: string;
  themeColor?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppBrandingService {
  private http = inject(HttpClient);

  private logoMemory: AppLogo | null = null;
  private bannersMemory: unknown[] | null = null;
  private logoRequest: Observable<{ success: boolean; logo: AppLogo }> | null = null;
  private bannersRequest: Observable<{ success: boolean; banners: unknown[] }> | null = null;

  getLogo(): Observable<{ success: boolean; logo: AppLogo }> {
    const cached = this.logoMemory ?? readPublicCache<AppLogo>(CACHE_KEYS.LOGO);
    if (cached) {
      this.logoMemory = cached;
      return of({ success: true, logo: cached });
    }

    if (!this.logoRequest) {
      this.logoRequest = this.http
        .get<{ success: boolean; logo: AppLogo }>(API_ENDPOINTS.appAssets.logo)
        .pipe(
          tap((res) => {
            if (res?.logo) {
              this.logoMemory = res.logo;
              writePublicCache(CACHE_KEYS.LOGO, res.logo, CACHE_TTL.LOGO_MS);
            }
          }),
          shareReplay(1),
        );
    }

    return this.logoRequest;
  }

  getBanners(): Observable<{ success: boolean; banners: unknown[] }> {
    const cached = this.bannersMemory ?? readPublicCache<unknown[]>(CACHE_KEYS.BANNERS);
    if (cached) {
      this.bannersMemory = cached;
      return of({ success: true, banners: cached });
    }

    if (!this.bannersRequest) {
      this.bannersRequest = this.http
        .get<{ success: boolean; banners: unknown[] }>(API_ENDPOINTS.appAssets.banners)
        .pipe(
          tap((res) => {
            const banners = res?.banners ?? [];
            this.bannersMemory = banners;
            writePublicCache(CACHE_KEYS.BANNERS, banners, CACHE_TTL.BANNERS_MS);
          }),
          shareReplay(1),
        );
    }

    return this.bannersRequest;
  }

  getLogoSnapshot(): AppLogo | null {
    return this.logoMemory ?? readPublicCache<AppLogo>(CACHE_KEYS.LOGO);
  }
}
