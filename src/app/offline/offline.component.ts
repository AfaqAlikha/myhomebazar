import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OfflineService } from '../core/services/offline.service';
import { ProductService } from '../services/product.service';
import { SeoService } from '../services/seo';

@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [NgIf, MatIconModule, MatButtonModule],
  templateUrl: './offline.component.html',
  styleUrl: './offline.component.css',
})
export class OfflineComponent implements OnInit, OnDestroy {
  logoUrl = '';
  isOnline = false;
  private onlineHandler = () => this.handleOnline();
  private readonly isBrowser: boolean;

  constructor(
    private offlineService: OfflineService,
    private productService: ProductService,
    private seo: SeoService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.seo.setDefaultSeo();
    this.isOnline = this.isBrowser ? navigator.onLine : false;

    this.productService.getAppLogo().subscribe({
      next: (res: any) => {
        const image = res?.logo?.image || res?.logo;
        if (typeof image === 'string' && image.trim()) {
          this.logoUrl = image;
        }
      },
    });

    if (this.isBrowser) {
      window.addEventListener('online', this.onlineHandler);
      if (navigator.onLine) {
        this.offlineService.tryReturnOnline();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('online', this.onlineHandler);
    }
  }

  refresh(): void {
    this.offlineService.refresh();
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.offlineService.tryReturnOnline();
  }
}
