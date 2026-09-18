import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const DISMISS_KEY = 'mhb_pwa_install_dismissed_at';
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class PwaService {
  private isBrowser: boolean;
  private deferredPrompt: any = null;
  private swReady: Promise<ServiceWorkerRegistration | null> | null = null;

  readonly canInstall = signal(false);
  readonly isStandalone = signal(false);
  readonly isIos = signal(false);
  readonly showInstallPrompt = signal(false);

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (!this.isBrowser) return;

    this.isStandalone.set(this.detectStandalone());
    this.isIos.set(this.detectIos());
    this.listenForInstallPrompt();
  }

  registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isBrowser || !('serviceWorker' in navigator)) {
      return Promise.resolve(null);
    }

    if (!this.swReady) {
      this.swReady = navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => reg)
        .catch(() => null);
    }

    return this.swReady;
  }

  maybeShowInstallPrompt(delayMs = 4000): void {
    if (!this.isBrowser || this.isStandalone()) return;
    if (this.isDismissedRecently()) return;

    window.setTimeout(() => {
      if (this.isStandalone()) return;
      if (this.canInstall() || this.isIos()) {
        this.showInstallPrompt.set(true);
      }
    }, delayMs);
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable' | 'ios'> {
    if (this.isIos() && !this.canInstall()) {
      return 'ios';
    }

    if (!this.deferredPrompt) return 'unavailable';

    this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.canInstall.set(false);

    if (choice?.outcome === 'accepted') {
      this.showInstallPrompt.set(false);
      return 'accepted';
    }

    this.dismissForAWhile();
    return 'dismissed';
  }

  dismissForAWhile(): void {
    this.showInstallPrompt.set(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }

  private listenForInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.canInstall.set(true);
      if (!this.isDismissedRecently() && !this.isStandalone()) {
        this.showInstallPrompt.set(true);
      }
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.showInstallPrompt.set(false);
      this.isStandalone.set(true);
    });
  }

  private detectStandalone(): boolean {
    const mq = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = (window.navigator as any).standalone === true;
    return mq || iosStandalone;
  }

  private detectIos(): boolean {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }

  private isDismissedRecently(): boolean {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      return Date.now() - Number(raw) < DISMISS_MS;
    } catch {
      return false;
    }
  }
}
