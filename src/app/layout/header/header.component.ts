import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  Inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { UserAvatarComponent } from '../../shared/user-avatar/user-avatar.component';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';
import { SpinnerService } from '../../shared/spinner.service';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PwaService } from '../../core/services/pwa.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    UiCardComponent,
    NgIf,
    UserAvatarComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  logo: any = null;
  user: any = null;
  userAvatar: string | null = null;
  token: string | null = null;
  unreadCount = 5;

  private subs: Subscription[] = [];
  private isBrowser: boolean;
  private profileAvatarLoadedFor: string | null = null;

  @Output() toggleDrawerEvent = new EventEmitter<void>();

  constructor(
    private auth: AuthService,
    private themeService: ThemeService,
    private spinnerService: SpinnerService,
    private router: Router,
    private productService: ProductService,
    public pwa: PwaService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  loadLogo(): void {
    this.productService.getAppLogo().subscribe({
      next: (res: any) => {
        if (res?.logo) {
          this.logo = res.logo;
        }
      },
    });
  }

  ngOnInit(): void {
    this.isDarkMode = this.themeService.isDark();
    this.subs.push(
      this.auth.user$.subscribe((u) => {
        this.user = u;
        if (u?.id) {
          if (this.profileAvatarLoadedFor !== u.id) {
            this.profileAvatarLoadedFor = u.id;
            this.auth.getMyProfile().subscribe({
              next: (profile) => {
                this.userAvatar = profile?.avatar || null;
              },
              error: () => {
                this.userAvatar = null;
              },
            });
          }
        } else {
          this.profileAvatarLoadedFor = null;
          this.userAvatar = null;
        }
      }),
      this.auth.token$.subscribe((t) => (this.token = t)),
      this.themeService.theme$.subscribe((theme) => {
        this.isDarkMode = theme === 'dark';
      }),
    );
    this.loadLogo();
  }

  logout(): void {
    this.spinnerService.show();

    if (this.isBrowser) {
      setTimeout(() => {
        this.auth.logout();
        this.spinnerService.hide();
        this.router.navigate(['']);
      }, 1000);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  openInstallPrompt(): void {
    if (this.pwa.isIos() && !this.pwa.canInstall()) {
      this.pwa.showInstallPrompt.set(true);
      return;
    }
    this.pwa.showInstallPrompt.set(true);
  }

  openDrawer(): void {
    this.toggleDrawerEvent.emit();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
