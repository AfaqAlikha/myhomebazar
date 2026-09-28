import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { env } from '../../environments/env';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (
        callback: (response: { authResponse?: { accessToken?: string }; status?: string }) => void,
        options?: { scope?: string },
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

@Injectable({ providedIn: 'root' })
export class SocialAuthService {
  private readonly isBrowser: boolean;
  private googleScriptPromise?: Promise<void>;
  private facebookScriptPromise?: Promise<void>;
  private facebookInitialized = false;
  private googleSignInInitialized = false;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get googleEnabled(): boolean {
    return Boolean(env.googleClientId?.trim());
  }

  get facebookEnabled(): boolean {
    return Boolean(env.facebookAppId?.trim());
  }

  private loadScript(src: string, id: string): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    if (document.getElementById(id)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${id}`));
      document.head.appendChild(script);
    });
  }

  loadGoogle(): Promise<void> {
    if (!this.googleEnabled) return Promise.reject(new Error('Google sign-in is not configured'));
    if (!this.googleScriptPromise) {
      this.googleScriptPromise = this.loadScript('https://accounts.google.com/gsi/client', 'google-gsi');
    }
    return this.googleScriptPromise;
  }

  loadFacebook(): Promise<void> {
    if (!this.facebookEnabled) return Promise.reject(new Error('Facebook sign-in is not configured'));
    if (!this.facebookScriptPromise) {
      this.facebookScriptPromise = new Promise((resolve, reject) => {
        window.fbAsyncInit = () => resolve();
        this.loadScript('https://connect.facebook.net/en_US/sdk.js', 'facebook-jssdk').catch(reject);
      });
    }
    return this.facebookScriptPromise;
  }

  renderGoogleButton(container: HTMLElement, onCredential: (idToken: string) => void): void {
    if (!this.isBrowser || !container || !this.googleEnabled) return;
    if (container.dataset['gsiRendered'] === '1') return;

    this.loadGoogle()
      .then(() => {
        if (!window.google?.accounts?.id) return;

        if (!this.googleSignInInitialized) {
          window.google.accounts.id.initialize({
            client_id: env.googleClientId,
            callback: (response: { credential?: string }) => {
              if (response?.credential) onCredential(response.credential);
            },
          });
          this.googleSignInInitialized = true;
        }

        const wrap =
          (container.closest('.social-google-wrap') as HTMLElement | null) ||
          container.parentElement ||
          container;
        const width = Math.floor(Math.max(wrap.getBoundingClientRect().width || 320, 280));

        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width,
          text: 'continue_with',
          shape: 'rectangular',
        });
        container.dataset['gsiRendered'] = '1';
      })
      .catch(() => {});
  }

  loginWithFacebook(): Promise<string> {
    return this.loadFacebook().then(
      () =>
        new Promise((resolve, reject) => {
          if (!window.FB) {
            reject(new Error('Facebook SDK unavailable'));
            return;
          }
          if (!this.facebookInitialized) {
            window.FB.init({
              appId: env.facebookAppId,
              cookie: true,
              xfbml: false,
              version: 'v19.0',
            });
            this.facebookInitialized = true;
          }
          window.FB.login(
            (response) => {
              const token = response.authResponse?.accessToken;
              if (token) resolve(token);
              else reject(new Error('Facebook sign-in was cancelled'));
            },
            { scope: 'public_profile,email' },
          );
        }),
    );
  }
}
