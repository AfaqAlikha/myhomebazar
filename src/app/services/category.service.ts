// category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // 👈 import map here
import { env } from '../../environments/env';
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
  private apiUrl = `${env.BASE_URL}/category`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http
      .get<{ success: boolean; categories: Category[] }>(this.apiUrl)
      .pipe(map((res) => res.categories)); // 👈 use map operator
  }

  getSubCategories(categoryId: string): Observable<any[]> {
    return this.http
      .get<{ success: boolean; subcategories: any[] }>(
        `${this.apiUrl}/${categoryId}/subcategories`
      )
      .pipe(map((res) => res.subcategories));
  }
}
