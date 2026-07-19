import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { ThemeMode, ThemeService } from './theme.service';
import {
  CACHE_KEYS,
  CACHE_TTL,
  readPublicCache,
  writePublicCache,
} from '../utils/public-cache';

export interface ThemePalette {
  background: string;
  card: string;
  primary: string;
  primaryHover: string;
  accent: string;
  accentHover: string;
  success: string;
  danger: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface SiteTheme {
  light: ThemePalette;
  dark: ThemePalette;
}

const CSS_VAR_KEYS: (keyof ThemePalette)[] = [
  'background',
  'card',
  'primary',
  'primaryHover',
  'accent',
  'accentHover',
  'success',
  'danger',
  'text',
  'textSecondary',
  'border',
];

const toCssVar = (key: keyof ThemePalette) =>
  `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;

@Injectable({ providedIn: 'root' })
export class SiteThemeService {
  private http = inject(HttpClient);
  private themeService = inject(ThemeService);
  private cached: SiteTheme | null = null;
  private loadPromise: Promise<SiteTheme | null> | null = null;

  constructor() {
    this.themeService.theme$.subscribe((mode) => this.applyPalette(mode));
  }

  async loadAndApply(): Promise<SiteTheme | null> {
    if (this.cached) {
      this.applyPalette(this.themeService.getTheme());
      return this.cached;
    }

    const stored = readPublicCache<SiteTheme>(CACHE_KEYS.THEME);
    if (stored) {
      this.cached = stored;
      this.applyPalette(this.themeService.getTheme());
      return stored;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.fetchTheme();
    const theme = await this.loadPromise;
    this.loadPromise = null;
    return theme;
  }

  private async fetchTheme(): Promise<SiteTheme | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ theme: SiteTheme }>(API_ENDPOINTS.theme.public),
      );
      this.cached = res.theme;
      writePublicCache(CACHE_KEYS.THEME, res.theme, CACHE_TTL.THEME_MS);
      this.applyPalette(this.themeService.getTheme());
      return res.theme;
    } catch {
      return null;
    }
  }

  applyPalette(mode: ThemeMode): void {
    if (!this.cached || typeof document === 'undefined') return;
    const palette = mode === 'dark' ? this.cached.dark : this.cached.light;
    const root = document.documentElement;
    CSS_VAR_KEYS.forEach((key) => {
      root.style.setProperty(toCssVar(key), palette[key]);
    });
  }

  getTheme(): SiteTheme | null {
    return this.cached;
  }
}
