import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'myhomebazar-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private isBrowser: boolean;
  private themeSubject: BehaviorSubject<ThemeMode>;
  theme$;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    const initial = this.resolveInitialTheme();
    this.themeSubject = new BehaviorSubject<ThemeMode>(initial);
    this.theme$ = this.themeSubject.asObservable();
    this.applyTheme(initial);

    if (this.isBrowser) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  getTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  setTheme(mode: ThemeMode): void {
    this.themeSubject.next(mode);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, mode);
    }
    this.applyTheme(mode);
  }

  toggleTheme(): void {
    this.setTheme(this.getTheme() === 'dark' ? 'light' : 'dark');
  }

  isDark(): boolean {
    return this.getTheme() === 'dark';
  }

  private resolveInitialTheme(): ThemeMode {
    if (!this.isBrowser) return 'light';
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(mode: ThemeMode): void {
    if (!this.isBrowser) return;
    const html = document.documentElement;
    const body = document.body;
    if (mode === 'dark') {
      html.classList.add('dark');
      body.classList.add('dark');
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
    }
  }
}
