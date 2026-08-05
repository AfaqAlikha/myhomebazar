import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { env } from '../../../environments/env';

@Injectable({ providedIn: 'root' })
export class PushService {
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  async register(): Promise<{ ok: boolean; reason?: string }> {
    if (!this.isBrowser || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { ok: false, reason: 'unsupported' };
    }

    try {
      const res: any = await firstValueFrom(
        this.http.get(`${env.BASE_URL}/notifications/push/vapid-key`),
      );
      const publicKey = res?.data?.publicKey;
      if (!publicKey) return { ok: false, reason: 'disabled' };

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return { ok: false, reason: 'denied' };

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicKey),
        });
      }

      await firstValueFrom(
        this.http.post(`${env.BASE_URL}/notifications/push/subscribe`, {
          subscription: subscription.toJSON(),
          platform: 'web',
          userAgent: navigator.userAgent,
        }),
      );

      return { ok: true };
    } catch {
      return { ok: false, reason: 'error' };
    }
  }
}
