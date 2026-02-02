import { Component, inject, OnInit, signal } from '@angular/core';
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
  title = signal('E-commerce App');

  user: any = null;
  token: string | null = null;

  private subs: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private spinnerService: SpinnerService,
  ) {}

  ngOnInit(): void {
    // 🔹 Subscribe to user + token changes
    this.subs.push(
      this.auth.user$.subscribe((u) => (this.user = u)),
      this.auth.token$.subscribe((t) => (this.token = t)),
    );
  }

  logout() {
    this.spinnerService.show();

    // wait 1 second before actually logging out
    setTimeout(() => {
      this.auth.logout();
      this.spinnerService.hide();
      this.router.navigate(['/home']);
    }, 1000); // 1000ms = 1 second
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
