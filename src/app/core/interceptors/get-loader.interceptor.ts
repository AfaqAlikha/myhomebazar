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
import { SKIP_GLOBAL_LOADER } from './loader.context';

const SKIP_URL_PATTERNS = [
  '/app-assets/public/',
  '/theme/',
  '/about/',
  '/home/public',
  '/categories',
  '/payments/settings/public',
  '/payments/methods',
  '/shipping/',
  '/pagination/settings/public',
  '/user/refresh-token',
  '/products/locations',
  '/products/home',
  '/products/featured',
];

const LOADER_DELAY_MS = 350;

@Injectable()
export class GetLoaderInterceptor implements HttpInterceptor {
  constructor(private spinner: SpinnerService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const track =
      req.method === 'GET' &&
      !req.context.get(SKIP_GLOBAL_LOADER) &&
      !this.shouldSkip(req.url);

    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let loaderVisible = false;

    if (track) {
      showTimer = setTimeout(() => {
        loaderVisible = true;
        this.spinner.show();
      }, LOADER_DELAY_MS);
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (showTimer) {
          clearTimeout(showTimer);
        }
        if (track && loaderVisible) {
          this.spinner.hide();
        }
      }),
    );
  }

  private shouldSkip(url: string): boolean {
    return SKIP_URL_PATTERNS.some((pattern) => url.includes(pattern));
  }
}
