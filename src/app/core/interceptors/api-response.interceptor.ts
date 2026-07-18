import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Unwraps `{ success, data: {...} }` so components keep using `res.user`, `res.products`, etc. */
@Injectable()
export class ApiResponseInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      map((event) => {
        if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
          const body = event.body as Record<string, unknown>;
          if ('data' in body && body['data'] !== undefined && body['data'] !== null) {
            return event.clone({ body: body['data'] });
          }
        }
        return event;
      }),
    );
  }
}
