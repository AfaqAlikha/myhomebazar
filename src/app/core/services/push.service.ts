import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { env } from '../../../environments/env';
import { PwaService } from './pwa.service';

@Injectable({ providedIn: 'root' })
export class PushService {
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private pwa: PwaService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);

    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
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

      const registration = await this.pwa.registerServiceWorker();
      if (!registration) return { ok: false, reason: 'sw-failed' };
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
