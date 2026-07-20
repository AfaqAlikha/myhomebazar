import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent implements OnInit, OnDestroy {
  logo: any = null;
  token: string | null = null;
  currentYear = new Date().getFullYear();
  private subs: Subscription[] = [];

  constructor(
    private productService: ProductService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.getLogo();
    this.subs.push(this.auth.token$.subscribe((t) => (this.token = t)));
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  getLogo(): void {
    this.productService.getAppLogo().subscribe({
      next: (res: any) => {
        if (res?.logo) {
          this.logo = res.logo;
        }
      },
    });
  }
}
