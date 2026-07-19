import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { AuthService } from '../auth/auth.service';
import { getEngagementHeaders, getOrCreateVisitorId } from '../utils/visitor-id';

export interface ProductEngagementResponse {
  success: boolean;
  recorded?: boolean;
  viewCount?: number;
  likeCount?: number;
  liked?: boolean;
  hasViewed?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductEngagementService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  recordView(productId: string): Observable<ProductEngagementResponse> {
    const token = this.authService.getToken();
    return this.http.post<ProductEngagementResponse>(
      API_ENDPOINTS.products.recordView(productId),
      { visitorId: getOrCreateVisitorId() },
      { headers: getEngagementHeaders(token) },
    );
  }

  toggleLike(productId: string): Observable<ProductEngagementResponse> {
    const token = this.authService.getToken();
    return this.http.post<ProductEngagementResponse>(
      API_ENDPOINTS.products.toggleLike(productId),
      {},
      { headers: getEngagementHeaders(token) },
    );
  }
}
