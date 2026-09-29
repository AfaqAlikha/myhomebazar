import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  Inject,
  HostListener,
  ElementRef,
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
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PwaService } from '../../core/services/pwa.service';
import { ChatService } from '../../services/chat.service';
import { HeaderProductSearchService } from '../../core/services/header-product-search.service';
import { SELLER_REGISTER_LABEL, SELLER_REGISTER_URL } from '../../core/constants/seller-portal';
import {
  SearchSuggestCategory,
  SearchSuggestProduct,
  SearchSuggestResult,
  SearchSuggestSeller,
  SearchSuggestService,
  SearchSuggestSubCategory,
} from '../../core/services/search-suggest.service';
import { HeaderSearchSuggestPanelComponent } from './header-search-suggest-panel.component';

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
    HeaderSearchSuggestPanelComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  readonly sellerRegisterUrl = SELLER_REGISTER_URL;
  readonly sellerRegisterLabel = SELLER_REGISTER_LABEL;
  isDarkMode = false;
  logo: any = null;
  user: any = null;
  userAvatar: string | null = null;
  token: string | null = null;
  messageUnread = 0;
  cartCount = 0;
  searchQuery = '';
  mobileSearchOpen = false;

  suggestOpen = false;
  suggestLoading = false;
  suggestResult: SearchSuggestResult | null = null;
  recentSearches: string[] = [];
  activeSuggestKey = '';

  private subs: Subscription[] = [];
  private isBrowser: boolean;
  private profileAvatarLoadedFor: string | null = null;
  private readonly queryInput$ = new Subject<string>();
  private suggestRequestId = 0;

  @Output() toggleDrawerEvent = new EventEmitter<void>();

  constructor(
    private auth: AuthService,
    private themeService: ThemeService,
    private router: Router,
    private productService: ProductService,
    private chatService: ChatService,
    private headerSearch: HeaderProductSearchService,
    private searchSuggest: SearchSuggestService,
    public pwa: PwaService,
    private elementRef: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  get showRecentInPanel(): boolean {
    return this.suggestOpen && !this.searchQuery.trim() && this.recentSearches.length > 0;
  }

  get showSuggestPanel(): boolean {
    if (!this.suggestOpen || !this.isBrowser) return false;
    if (this.showRecentInPanel) return true;
    if (this.searchQuery.trim().length >= 1) return true;
    return false;
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
    this.refreshRecentSearches();

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
        .subscribe(() => {
          this.closeSuggest();
          this.mobileSearchOpen = false;
          this.syncSearchFromScope();
        }),
      this.queryInput$
        .pipe(
          debounceTime(280),
          distinctUntilChanged(),
          tap(() => {
            this.suggestLoading = true;
          }),
          switchMap((query) => {
            const requestId = ++this.suggestRequestId;
            const trimmed = query.trim();
            if (trimmed.length < 2) {
              this.suggestLoading = false;
              this.suggestResult = null;
              return of(null);
            }
            return this.searchSuggest.fetchSuggestions(trimmed).pipe(
              tap((result) => {
                if (requestId !== this.suggestRequestId) return;
                this.suggestResult = result;
                this.suggestLoading = false;
                this.resetActiveSuggestKey();
              }),
            );
          }),
        )
        .subscribe(),
    );
    this.syncSearchFromScope();
    this.loadLogo();
  }

  toggleMobileSearch(): void {
    this.mobileSearchOpen = !this.mobileSearchOpen;
    if (!this.mobileSearchOpen) {
      this.closeSuggest();
    }
  }

  onSearchInput(): void {
    if (!this.isBrowser) return;
    this.suggestOpen = true;
    this.queryInput$.next(this.searchQuery);
    if (!this.searchQuery.trim()) {
      this.suggestResult = null;
      this.suggestLoading = false;
      this.refreshRecentSearches();
      this.resetActiveSuggestKey();
    }
  }

  onSearchFocus(): void {
    if (!this.isBrowser) return;
    this.suggestOpen = true;
    this.refreshRecentSearches();
    this.resetActiveSuggestKey();
    if (this.searchQuery.trim().length >= 2) {
      this.queryInput$.next(this.searchQuery);
    }
  }

  onSearchSubmit(event?: Event): void {
    event?.preventDefault();
    this.runKeywordSearch(this.searchQuery);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSuggest();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!this.showSuggestPanel) return;
      event.preventDefault();
      this.moveActiveSuggestKey(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter') {
      if (this.showSuggestPanel && this.activeSuggestKey) {
        event.preventDefault();
        this.activateSuggestKey(this.activeSuggestKey);
        return;
      }
      event.preventDefault();
      this.onSearchSubmit();
    }
  }

  onKeywordPick(query: string): void {
    this.runKeywordSearch(query);
  }

  onRecentPick(query: string): void {
    this.searchQuery = query;
    this.runKeywordSearch(query);
  }

  onClearRecent(): void {
    this.searchSuggest.clearRecentSearches();
    this.refreshRecentSearches();
    this.resetActiveSuggestKey();
  }

  onProductPick(product: SearchSuggestProduct): void {
    this.closeSuggest();
    this.mobileSearchOpen = false;
    void this.router.navigate(['/product/details', product._id]);
  }

  onCategoryPick(category: SearchSuggestCategory): void {
    this.closeSuggest();
    this.mobileSearchOpen = false;
    void this.router.navigate(['/category', category.slug || 'category', category._id]);
  }

  onSubCategoryPick(sub: SearchSuggestSubCategory): void {
    this.runKeywordSearch(sub.name);
  }

  onBrandPick(brand: string): void {
    this.runKeywordSearch(brand);
  }

  onSellerPick(seller: SearchSuggestSeller): void {
    this.closeSuggest();
    this.mobileSearchOpen = false;
    void this.router.navigate(['/profile', seller._id]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.suggestOpen) return;
    const target = event.target as Node | null;
    if (target && this.elementRef.nativeElement.contains(target)) return;
    this.closeSuggest();
  }

  private runKeywordSearch(query: string): void {
    const trimmed = query.trim();
    if (trimmed) {
      this.searchSuggest.rememberSearch(trimmed);
    }
    this.searchQuery = trimmed;
    this.headerSearch.submit(trimmed);
    this.closeSuggest();
    this.mobileSearchOpen = false;
  }

  private closeSuggest(): void {
    this.suggestOpen = false;
    this.suggestLoading = false;
    this.activeSuggestKey = '';
  }

  private refreshRecentSearches(): void {
    this.recentSearches = this.searchSuggest.getRecentSearches();
  }

  private buildSuggestKeys(): string[] {
    const keys: string[] = [];
    if (this.showRecentInPanel) {
      this.recentSearches.forEach((_, index) => keys.push(`recent:${index}`));
    }
    const q = this.searchQuery.trim();
    if (q.length >= 2) {
      keys.push('keyword');
      this.suggestResult?.products?.forEach((_, index) => keys.push(`product:${index}`));
      this.suggestResult?.categories?.forEach((_, index) => keys.push(`category:${index}`));
      this.suggestResult?.subCategories?.forEach((_, index) => keys.push(`subcategory:${index}`));
      this.suggestResult?.brands?.forEach((_, index) => keys.push(`brand:${index}`));
      this.suggestResult?.sellers?.forEach((_, index) => keys.push(`seller:${index}`));
    }
    return keys;
  }

  private resetActiveSuggestKey(): void {
    const keys = this.buildSuggestKeys();
    this.activeSuggestKey = keys[0] || '';
  }

  private moveActiveSuggestKey(delta: number): void {
    const keys = this.buildSuggestKeys();
    if (!keys.length) {
      this.activeSuggestKey = '';
      return;
    }
    const currentIndex = keys.indexOf(this.activeSuggestKey);
    const nextIndex =
      currentIndex === -1
        ? delta > 0
          ? 0
          : keys.length - 1
        : (currentIndex + delta + keys.length) % keys.length;
    this.activeSuggestKey = keys[nextIndex];
  }

  private activateSuggestKey(key: string): void {
    if (key === 'keyword') {
      this.runKeywordSearch(this.searchQuery);
      return;
    }
    if (key.startsWith('recent:')) {
      const index = Number(key.split(':')[1]);
      const term = this.recentSearches[index];
      if (term) this.onRecentPick(term);
      return;
    }
    if (key.startsWith('product:')) {
      const index = Number(key.split(':')[1]);
      const product = this.suggestResult?.products?.[index];
      if (product) this.onProductPick(product);
      return;
    }
    if (key.startsWith('category:')) {
      const index = Number(key.split(':')[1]);
      const category = this.suggestResult?.categories?.[index];
      if (category) this.onCategoryPick(category);
      return;
    }
    if (key.startsWith('subcategory:')) {
      const index = Number(key.split(':')[1]);
      const sub = this.suggestResult?.subCategories?.[index];
      if (sub) this.onSubCategoryPick(sub);
      return;
    }
    if (key.startsWith('brand:')) {
      const index = Number(key.split(':')[1]);
      const brand = this.suggestResult?.brands?.[index];
      if (brand) this.onBrandPick(brand);
      return;
    }
    if (key.startsWith('seller:')) {
      const index = Number(key.split(':')[1]);
      const seller = this.suggestResult?.sellers?.[index];
      if (seller) this.onSellerPick(seller);
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
    this.queryInput$.complete();
  }
}
