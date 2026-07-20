import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    if (this.auth.isLoggedIn()) {
      return of(true);
    }

    return this.auth.trySilentRefresh().pipe(
      switchMap((ok) => {
        if (ok && this.auth.isLoggedIn()) {
          return of(true);
        }
        if (this.auth.hasExpiredSession()) {
          this.auth.clearStaleSession();
        } else {
          this.router.navigate(['/signin']);
        }
        return of(false);
      }),
      map((allowed) => allowed),
    );
  }
}
