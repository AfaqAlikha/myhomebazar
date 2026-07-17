import { Component, inject, OnInit, signal, Inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SharedModule } from './shared/shared.module';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { Subscription } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxSpinnerModule } from 'ngx-spinner';
import { SpinnerService } from './shared/spinner.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from './services/product.service';
import { ThemeService } from './core/services/theme.service';
import { SiteThemeService } from './core/services/site-theme.service';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSidenavModule,
    SharedModule,
    RouterLink,
    RouterLinkActive,
    MatMenuModule,
    NgxPaginationModule,
    NgxSpinnerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit {
  loading = true;
  private router = inject(Router);

  user: any = null;
  token: string | null = null;

  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private spinnerService: SpinnerService,
    private productService: ProductService,
    private pageTitle: Title,
    private themeService: ThemeService,
    private siteThemeService: SiteThemeService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    // 🔹 Subscribe to user + token changes
    this.subs.push(
      this.auth.user$.subscribe((u) => (this.user = u)),
      this.auth.token$.subscribe((t) => (this.token = t)),
    );
    this.siteThemeService.loadAndApply();
    this.loadLogo();
    this.auth.trySilentRefresh().subscribe();
  }

  loadLogo(): void {
    this.productService.getAppLogo().subscribe({
      next: (res: any) => {
        if (!res.success || !res.logo) return;

        const logo = res.logo;

        // ✅ Page Title
        this.pageTitle.setTitle(logo.siteName || 'MyHomeBazar');

        // ✅ Favicon
        let favicon = this.document.querySelector("link[rel='icon']") as HTMLLinkElement;

        if (!favicon) {
          favicon = this.document.createElement('link');
          favicon.rel = 'icon';
          this.document.head.appendChild(favicon);
        }

        favicon.href = logo.image;

        // ✅ Theme Color
        let metaTheme = this.document.querySelector("meta[name='theme-color']") as HTMLMetaElement;

        if (!metaTheme) {
          metaTheme = this.document.createElement('meta');
          metaTheme.name = 'theme-color';
          this.document.head.appendChild(metaTheme);
        }

        metaTheme.content = logo.themeColor || '#16a34a';
      },
    });
  }

  logout() {
    this.spinnerService.show();

    // wait 1 second before actually logging out
    setTimeout(() => {
      this.auth.logout();
      this.spinnerService.hide();
      this.router.navigate(['']);
    }, 1000); // 1000ms = 1 second
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
