import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ViewportTier = 'mobile' | 'tablet' | 'desktop';

export interface GridPreferences {
  mobile: number;
  tablet: number;
  desktop: number;
}

@Injectable({ providedIn: 'root' })
export class ProductGridLayoutService {
  viewportTier: ViewportTier = 'desktop';
  gridPreferences: GridPreferences = {
    mobile: 2,
    tablet: 3,
    desktop: 4,
  };

  private readonly gridStorageKey = 'myhomebazar.homeGridPreferences';
  private readonly gridOptionsByTier: Record<ViewportTier, number[]> = {
    mobile: [1, 2],
    tablet: [2, 3],
    desktop: [3, 4],
  };
  private readonly gridIconByColumns: Record<number, string> = {
    1: 'view_agenda',
    2: 'view_column',
    3: 'view_comfy',
    4: 'grid_view',
  };
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadGridPreference();
      this.syncViewport();
    }
  }

  get effectiveGridColumns(): number {
    const preferred = this.gridPreferences[this.viewportTier];
    const options = this.gridOptionsByTier[this.viewportTier];
    return options.includes(preferred) ? preferred : options[options.length - 1];
  }

  get gridLayoutIcon(): string {
    return this.gridIconByColumns[this.effectiveGridColumns] || 'grid_view';
  }

  get gridLayoutLabel(): string {
    const options = this.gridOptionsByTier[this.viewportTier];
    const currentIndex = options.indexOf(this.effectiveGridColumns);
    const next = options[(currentIndex + 1) % options.length];
    return `Current ${this.effectiveGridColumns} cards per row. Switch to ${next}.`;
  }

  get productGridClass(): string {
    const map: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    };
    return map[this.effectiveGridColumns] || 'grid-cols-1';
  }

  cycleGridLayout(): void {
    const options = this.gridOptionsByTier[this.viewportTier];
    const currentIndex = options.indexOf(this.effectiveGridColumns);
    const next = options[(currentIndex + 1) % options.length];
    this.gridPreferences = {
      ...this.gridPreferences,
      [this.viewportTier]: next,
    };
    this.saveGridPreferences();
  }

  syncViewport(): void {
    if (!this.isBrowser) return;
    this.viewportTier = this.getViewportTier();
  }

  private saveGridPreferences(): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.gridStorageKey, JSON.stringify(this.gridPreferences));
  }

  private loadGridPreference(): void {
    if (!this.isBrowser) return;

    try {
      const saved = JSON.parse(localStorage.getItem(this.gridStorageKey) || '{}') as Partial<GridPreferences>;
      this.gridPreferences = {
        mobile:
          saved.mobile && this.gridOptionsByTier.mobile.includes(saved.mobile) ? saved.mobile : 2,
        tablet:
          saved.tablet && this.gridOptionsByTier.tablet.includes(saved.tablet) ? saved.tablet : 3,
        desktop:
          saved.desktop && this.gridOptionsByTier.desktop.includes(saved.desktop)
            ? saved.desktop
            : 4,
      };
    } catch {
      this.gridPreferences = { mobile: 2, tablet: 3, desktop: 4 };
    }
  }

  private getViewportTier(): ViewportTier {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 768) return 'tablet';
    return 'desktop';
  }
}
