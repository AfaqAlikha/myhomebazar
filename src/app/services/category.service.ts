import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { API_ENDPOINTS } from '../core/config/api-endpoints';

export interface Category {
  _id: string;
  name: string;
  color?: string;
  images?: string[];
  subCategory?: { _id: string; subCategory: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categoriesCache$?: Observable<Category[]>;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.http
        .get<{ success: boolean; categories: Category[] }>(API_ENDPOINTS.category.list)
        .pipe(
          map((res) => res.categories),
          shareReplay(1),
        );
    }
    return this.categoriesCache$;
  }

  getSubCategories(categoryId: string): Observable<any[]> {
    return this.http
      .get<{ success: boolean; subcategories: any[] }>(
        API_ENDPOINTS.category.subcategories(categoryId),
      )
      .pipe(map((res) => res.subcategories));
  }

  getChildSubCategories(subCategoryId: string): Observable<any[]> {
    return this.http
      .get<{
        success: boolean;
        childSubCategories: any[];
      }>(API_ENDPOINTS.category.childSubcategories(subCategoryId))
      .pipe(map((res) => res.childSubCategories));
  }
}
