import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../config/api-endpoints';

export interface SearchSuggestProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  brand?: string;
  catName?: string;
}

export interface SearchSuggestCategory {
  _id: string;
  name: string;
  slug: string;
  image: string;
  color?: string;
}

export interface SearchSuggestSubCategory {
  _id: string;
  name: string;
  categoryId: string;
  categoryName: string;
}

export interface SearchSuggestSeller {
  _id: string;
  name: string;
  avatar: string;
  location: string;
}

export interface SearchSuggestResult {
  query: string;
  products: SearchSuggestProduct[];
  categories: SearchSuggestCategory[];
  subCategories: SearchSuggestSubCategory[];
  sellers: SearchSuggestSeller[];
  brands: string[];
}

const RECENT_KEY = 'mhb_recent_searches';
const RECENT_MAX = 8;

@Injectable({ providedIn: 'root' })
export class SearchSuggestService {
  private readonly http = inject(HttpClient);

  fetchSuggestions(query: string): Observable<SearchSuggestResult | null> {
    const q = query.trim();
    if (q.length < 2) {
      return of(null);
    }

    const params = new HttpParams().set('q', q);
    return this.http
      .get<SearchSuggestResult>(API_ENDPOINTS.search.suggest, { params })
      .pipe(
        map((body) => body ?? null),
        catchError(() => of(null)),
      );
  }

  getRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(list) ? list.filter((s) => typeof s === 'string' && s.trim()) : [];
    } catch {
      return [];
    }
  }

  rememberSearch(query: string): void {
    const q = query.trim();
    if (!q || typeof window === 'undefined') return;
    try {
      const prev = this.getRecentSearches().filter((item) => item.toLowerCase() !== q.toLowerCase());
      const next = [q, ...prev].slice(0, RECENT_MAX);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  clearRecentSearches(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(RECENT_KEY);
  }
}
