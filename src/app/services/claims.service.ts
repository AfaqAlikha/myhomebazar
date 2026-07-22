import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { API_ENDPOINTS } from '../core/config/api-endpoints';
import { AuthService } from '../auth/auth.service';
import { Claim, ClaimsListResponse } from '../core/models/claim.model';

export interface CreateClaimPayload {
  orderId: string;
  reason: string;
  description: string;
  images?: File[];
}

@Injectable({ providedIn: 'root' })
export class ClaimsService {
  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private authService: AuthService,
  ) {}

  createClaim(data: CreateClaimPayload): Observable<{ claim: Claim; message: string }> {
    const formData = new FormData();
    formData.append('orderId', data.orderId);
    formData.append('reason', data.reason);
    formData.append('description', data.description);

    (data.images || []).forEach((file) => {
      formData.append('images', file);
    });

    return this.http.post(API_ENDPOINTS.claims.create, formData, { headers: this.getHeaders() }).pipe(
      map((res: any) => ({
        claim: res.data?.claim || res.claim,
        message: res.message || 'Claim submitted successfully',
      })),
      tap((res) => {
        if (res?.message) this.toastr.success(res.message);
      }),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Failed to submit claim');
        return throwError(() => err);
      }),
    );
  }

  getClaims(params?: { page?: number; status?: string }): Observable<ClaimsListResponse> {
    let queryParams = new HttpParams().set('scope', 'buyer');
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams = queryParams.set(key, String(value));
        }
      });
    }

    return this.http
      .get(API_ENDPOINTS.claims.list, {
        headers: this.getHeaders(),
        params: queryParams,
      })
      .pipe(
        map((res: any) => ({
          claims: res.data?.claims || res.claims || [],
          pagination: res.meta?.pagination ||
            res.pagination || {
              totalItems: 0,
              totalPages: 0,
              currentPage: 1,
              pageSize: 10,
            },
        })),
        catchError((err) => {
          this.toastr.error(err?.error?.message || 'Failed to load claims');
          return throwError(() => err);
        }),
      );
  }

  getClaimById(id: string): Observable<Claim> {
    return this.http.get(API_ENDPOINTS.claims.byId(id), { headers: this.getHeaders() }).pipe(
      map((res: any) => res.data?.claim || res.claim),
      catchError((err) => {
        this.toastr.error(err?.error?.message || 'Failed to load claim');
        return throwError(() => err);
      }),
    );
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
