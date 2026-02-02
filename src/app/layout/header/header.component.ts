import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
  Inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { SpinnerService } from '../../shared/spinner.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

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
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isSticky = false;
  isDarkMode = false;

  user: any = null;
  token: string | null = null;
  unreadCount = 5;

  private subs: Subscription[] = [];
  private isBrowser: boolean;

  @Output() toggleDrawerEvent = new EventEmitter<void>();

  constructor(
    private auth: AuthService,
    private spinnerService: SpinnerService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // ✅ SSR-safe scroll listener
  @HostListener('window:scroll', [])
  onScroll() {
    if (this.isBrowser) {
      this.isSticky = window.scrollY > 50;
    }
  }

  ngOnInit(): void {
    this.subs.push(
      this.auth.user$.subscribe((u) => (this.user = u)),
      this.auth.token$.subscribe((t) => (this.token = t))
    );
  }

  logout() {
    this.spinnerService.show();

    if (this.isBrowser) {
      setTimeout(() => {
        this.auth.logout();
        this.spinnerService.hide();
        this.router.navigate(['/home']);
      }, 1000);
    }
  }

  // ✅ SSR-safe theme toggle
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;

    if (this.isBrowser) {
      const html = document.documentElement;

      if (this.isDarkMode) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }

  openDrawer() {
    this.toggleDrawerEvent.emit();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
