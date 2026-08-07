import { Component, inject, OnInit, Inject } from '@angular/core';
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
import { SeoService } from './services/seo';
import { PushService } from './core/services/push.service';
import { PwaService } from './core/services/pwa.service';
import { PwaSplashComponent } from './shared/pwa-splash/pwa-splash.component';
import { PwaInstallPromptComponent } from './shared/pwa-install-prompt/pwa-install-prompt.component';
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
    PwaSplashComponent,
    PwaInstallPromptComponent,
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
    private seo: SeoService,
    private themeService: ThemeService,
    private siteThemeService: SiteThemeService,
    private pushService: PushService,
    private pwa: PwaService,
  ) {}

  ngOnInit(): void {
    // 🔹 Subscribe to user + token changes
    this.subs.push(
      this.auth.user$.subscribe((u) => {
        this.user = u;
        if (u?.id) {
          this.pushService.register().catch(() => {});
        }
      }),
      this.auth.token$.subscribe((t) => (this.token = t)),
    );
    this.siteThemeService.loadAndApply();
    this.loadLogo();

    // PWA: register SW early (installability + offline), then offer install UI
    this.pwa.registerServiceWorker().then(() => {
      this.pwa.maybeShowInstallPrompt(4500);
    });

    if (!this.auth.isGuestAuthRoute()) {
      this.auth.trySilentRefresh().subscribe();
    } else {
      this.auth.clearStaleSession();
    }
  }

  loadLogo(): void {
    this.productService.getAppLogo().subscribe({
      next: (res: any) => {
        if (!res.success || !res.logo) return;
        this.seo.setOrganizationBranding(res.logo);
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
