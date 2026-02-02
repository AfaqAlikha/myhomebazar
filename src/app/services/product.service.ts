import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { env } from '../../environments/env';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private baseUrl = `${env.BASE_URL}/products`;

  constructor(private http: HttpClient) {}

  // Get all products with filters and pagination
  getProducts(params?: any): Observable<any> {
    let queryParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams = queryParams.set(key, params[key]);
        }
      });
    }

    return this.http.get(`${this.baseUrl}`, { params: queryParams });
  }

  // product.service.ts
  getMyProducts(params?: any): Observable<any> {
    let queryParams = new HttpParams();
    const headers = this.getHeaders(); // JWT auth header
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams = queryParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/my-products`, {
      params: queryParams,
      headers,
    });
  }

  // Get home products (Featured → Promotion → Rated)
  getHomeProducts(page: number = 1): Observable<any> {
    return this.http.get(`${this.baseUrl}/home-products`, {
      params: { page },
    });
  }

  // Get only Featured products
  getFeaturedProducts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/banner-products`);
  }

  getProductsByCategoryName(filters: {
    catName?: string;
    subCatName?: string;
    page?: number;
    limit?: number;
    sort?: string; // 'low' | 'high'
    search?: string;
  }): Observable<any> {
    let params = new HttpParams();

    if (filters.catName) params = params.set('catName', filters.catName);
    if (filters.subCatName)
      params = params.set('subCatName', filters.subCatName);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<any>(this.baseUrl, { params });
  }

  // Get product by ID
  getProductById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  // Get public products by seller ID
  getProductsBySeller(
    sellerId: string,
    page: number = 1,
    limit: number = 10
  ): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.baseUrl}/seller/${sellerId}`, { params });
  }

  // ✅ Private Helpers
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    });
  }
}
