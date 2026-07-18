import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getProducts(params?: Record<string, unknown>): Observable<any> {
    let queryParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const val = params[key];
        if (val !== undefined && val !== null) {
          queryParams = queryParams.set(key, String(val));
        }
      });
    }

    return this.http.get(API_ENDPOINTS.products.list, { params: queryParams });
  }

  getMyProducts(params?: Record<string, unknown>): Observable<any> {
    let queryParams = new HttpParams();
    const headers = this.getHeaders();
    if (params) {
      Object.keys(params).forEach((key) => {
        const val = params[key];
        if (val !== undefined && val !== null) {
          queryParams = queryParams.set(key, String(val));
        }
      });
    }
    return this.http.get(API_ENDPOINTS.products.myProducts, {
      params: queryParams,
      headers,
    });
  }

  getHomeProducts(
    page = 1,
    filters?: { country?: string; state?: string; city?: string },
  ): Observable<any> {
    let params = new HttpParams().set('page', String(page)).set('home', 'true');

    if (filters?.country) params = params.set('country', filters.country);
    if (filters?.state) params = params.set('state', filters.state);
    if (filters?.city) params = params.set('city', filters.city);

    return this.http.get(API_ENDPOINTS.products.list, { params });
  }

  getProductLocations(): Observable<{ countries: string[]; states: string[]; cities: string[] }> {
    return this.http.get(API_ENDPOINTS.products.locations).pipe(
      map((res: any) => res.data || res),
    );
  }

  getFeaturedProducts(): Observable<any> {
    return this.http.get(API_ENDPOINTS.appAssets.banners);
  }

  getAppLogo(): Observable<any> {
    return this.http.get(API_ENDPOINTS.appAssets.logo);
  }

  getProductsByCategoryName(filters: {
    catName?: string;
    subCatName?: string;
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
  }): Observable<any> {
    let params = new HttpParams();

    if (filters.catName) params = params.set('catName', filters.catName);
    if (filters.subCatName) params = params.set('subCatName', filters.subCatName);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<any>(API_ENDPOINTS.products.list, { params });
  }

  getProductById(id: string): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.products.byId(id));
  }

  getProductsBySeller(
    sellerId: string,
    page = 1,
    limit = 10,
    search = '',
  ): Observable<any> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (search) params = params.set('search', search);

    return this.http.get<any>(API_ENDPOINTS.products.bySeller(sellerId), { params });
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }
}
