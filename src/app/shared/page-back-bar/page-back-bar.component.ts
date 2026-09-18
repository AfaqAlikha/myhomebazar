import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-page-back-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './page-back-bar.component.html',
  styleUrl: './page-back-bar.component.css',
})
export class PageBackBarComponent implements OnInit, OnDestroy {
  visible = false;

  private sub?: Subscription;
  private readonly isBrowser: boolean;

  constructor(
    private readonly router: Router,
    private readonly location: Location,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.updateVisibility(this.router.url);
    this.sub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects || (event as NavigationEnd).url;
        this.updateVisibility(url);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  goBack(): void {
    if (this.isBrowser && window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigateByUrl('/');
  }

  private updateVisibility(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    this.visible = path !== '/' && path !== '';
  }
}
