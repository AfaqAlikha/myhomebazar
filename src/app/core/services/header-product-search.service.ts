import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class HeaderProductSearchService {
  private readonly router = inject(Router);
  private readonly stores = new Map<string, BehaviorSubject<string>>();
  private activeScope = '';

  constructor() {
    this.activeScope = this.resolveScope(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.activeScope = this.resolveScope(event.urlAfterRedirects);
      });
  }

  resolveScope(url: string): string {
    const path = (url.split('?')[0] || '/').replace(/\/+$/, '') || '/';

    if (path === '/') return 'home';
    if (path === '/shop') return 'shop';
    if (path === '/deals') return 'deals';
    if (path === '/free-delivery') return 'free-delivery';
    if (path === '/wishlist') return 'wishlist';
    if (path === '/my-acount') return 'my-account';

    const categoryMatch = path.match(/^\/category\/[^/]+\/([^/]+)$/);
    if (categoryMatch) return `category:${categoryMatch[1]}`;

    const profileMatch = path.match(/^\/profile\/([^/]+)$/);
    if (profileMatch) return `profile:${profileMatch[1]}`;

    return '';
  }

  isProductPage(scope = this.activeScope): boolean {
    return Boolean(scope);
  }

  getActiveScope(): string {
    return this.activeScope;
  }

  getQuery(scope = this.activeScope): string {
    return scope ? this.subjectFor(scope).value : '';
  }

  watch(scope = this.activeScope): Observable<string> {
    return this.subjectFor(scope).asObservable();
  }

  setQuery(scope: string, query: string): void {
    if (!scope) return;
    const subject = this.subjectFor(scope);
    if (subject.value !== query) {
      subject.next(query);
    }
  }

  submit(query: string): void {
    const trimmed = query.trim();
    const scope = this.activeScope;

    if (!scope) {
      this.subjectFor('shop').next(trimmed);
      void this.router.navigate(['/shop']);
      return;
    }

    this.subjectFor(scope).next(trimmed);
  }

  bindPageSearch(
    destroyRef: DestroyRef,
    scope: string,
    onSearch: (query: string) => void,
    debounceMs = 350,
  ): void {
    this.watch(scope)
      .pipe(debounceTime(debounceMs), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
      .subscribe(onSearch);
  }

  private subjectFor(scope: string): BehaviorSubject<string> {
    let subject = this.stores.get(scope);
    if (!subject) {
      subject = new BehaviorSubject('');
      this.stores.set(scope, subject);
    }
    return subject;
  }
}
