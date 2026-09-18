import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SpinnerService } from '../../shared/spinner.service';

const SKIP_URL_PATTERNS = [
  '/app-assets/public/',
  '/theme/',
  '/about/',
  '/payments/settings/public',
  '/payments/methods',
  '/shipping/',
  '/user/refresh-token',
  '/products/locations',
];

@Injectable()
export class GetLoaderInterceptor implements HttpInterceptor {
  constructor(private spinner: SpinnerService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const track = req.method === 'GET' && !this.shouldSkip(req.url);

    if (track) {
      this.spinner.show();
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (track) {
          this.spinner.hide();
        }
      }),
    );
  }

  private shouldSkip(url: string): boolean {
    return SKIP_URL_PATTERNS.some((pattern) => url.includes(pattern));
  }
}
