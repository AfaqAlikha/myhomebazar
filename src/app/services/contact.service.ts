import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { API_ENDPOINTS } from '../core/config/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
  ) {}

  submitContact(data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
  }): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.contact.submit, data).pipe(
      tap((res) => {
        if (res?.message) this.toastr.success(res.message);
      }),
      catchError((error) => this.handleError(error, 'Failed to send contact message')),
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
