import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

const RETURN_URL_KEY = 'myhomebazar.offlineReturnUrl';

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private readonly isBrowser: boolean;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      window.addEventListener('offline', () => this.goOffline());
      window.addEventListener('online', () => this.tryReturnOnline());
    }
  }

  isOfflinePage(): boolean {
    return this.router.url.startsWith('/offline');
  }

  goOffline(returnUrl?: string): void {
    if (!this.isBrowser || this.isOfflinePage()) return;

    const nextUrl = returnUrl || this.router.url || '/';
    sessionStorage.setItem(RETURN_URL_KEY, nextUrl);
    this.router.navigate(['/offline']);
  }

  refresh(): void {
    if (!this.isBrowser) return;
    if (navigator.onLine) {
      this.tryReturnOnline();
      return;
    }
    window.location.reload();
  }

  tryReturnOnline(): void {
    if (!this.isBrowser || !navigator.onLine) return;

    const savedUrl = sessionStorage.getItem(RETURN_URL_KEY) || '/';
    sessionStorage.removeItem(RETURN_URL_KEY);

    if (this.isOfflinePage()) {
      this.router.navigateByUrl(savedUrl);
    }
  }

  getSavedReturnUrl(): string {
    if (!this.isBrowser) return '/';
    return sessionStorage.getItem(RETURN_URL_KEY) || '/';
  }
}
