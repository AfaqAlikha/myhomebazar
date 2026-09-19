import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  Inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PwaService } from '../../core/services/pwa.service';
import { ChatService } from '../../services/chat.service';
import { HeaderProductSearchService } from '../../core/services/header-product-search.service';

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
    FormsModule,
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
  messageUnread = 0;
  cartCount = 0;
  searchQuery = '';

  private subs: Subscription[] = [];
  private isBrowser: boolean;
  private profileAvatarLoadedFor: string | null = null;

  @Output() toggleDrawerEvent = new EventEmitter<void>();

  constructor(
    private auth: AuthService,
    private themeService: ThemeService,
    private router: Router,
    private productService: ProductService,
    private chatService: ChatService,
    private headerSearch: HeaderProductSearchService,
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
      this.chatService.conversations$.subscribe(() => {
        this.messageUnread = this.chatService.unreadTotal;
      }),
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => this.syncSearchFromScope()),
    );
    this.syncSearchFromScope();
    this.loadLogo();
  }

  onSearchSubmit(event?: Event): void {
    event?.preventDefault();
    this.headerSearch.submit(this.searchQuery);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSearchSubmit();
    }
  }

  private syncSearchFromScope(): void {
    const scope = this.headerSearch.getActiveScope();
    this.searchQuery = scope ? this.headerSearch.getQuery(scope) : '';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['']);
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
