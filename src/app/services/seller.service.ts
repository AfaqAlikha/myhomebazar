import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../core/config/api-endpoints';

export interface SellerProfile {
  _id: string;
  name: string;
  bio?: string;
  role: string;
  rating?: number;
  badges?: string[];
  country?: string;
  state?: string;
  city?: string;
  completedOrders?: number;
}

@Injectable({ providedIn: 'root' })
export class SellerService {
  constructor(private http: HttpClient) {}

  getSellers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
    state?: string;
    city?: string;
  }): Observable<{ sellers: SellerProfile[]; pagination: any }> {
    let queryParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams = queryParams.set(key, String(value));
        }
      });
    }

    return this.http.get(API_ENDPOINTS.auth.sellers, { params: queryParams }).pipe(
      map((res: any) => ({
        sellers: res.data?.sellers || res.sellers || [],
        pagination: res.meta?.pagination || res.pagination || {},
      })),
    );
  }
}
