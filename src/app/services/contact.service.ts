// src/app/services/contact.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { env } from '../../environments/env';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private baseUrl = `${env.BASE_URL}/contact`;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  // ✅ Submit contact form
  submitContact(data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
  }): Observable<any> {
    return this.http.post<any>(this.baseUrl, data).pipe(
      tap((res) => {
        if (res?.message) this.toastr.success(res.message);
      }),
      catchError((error) =>
        this.handleError(error, 'Failed to send contact message')
      )
    );
  }

  private handleError(error: any, defaultMsg: string) {
    let errorMsg = defaultMsg;
    if (error.error?.error) {
      errorMsg = error.error.error;
    } else if (error.error?.message) {
      errorMsg = error.error.message;
    }
    this.toastr.error(errorMsg);
    return throwError(() => error);
  }
}
