import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiPasswordComponent } from '../../shared/ui-password/ui-password.component';
import { UiInputComponent } from '../../shared/ui-input/ui-input.component';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { AuthService } from '../auth.service';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { NgIf } from '@angular/common';
import { env } from '../../../environments/env';

@Component({
  selector: 'app-signin',
  standalone: true,
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
  imports: [
    ReactiveFormsModule,
    UiInputComponent,
    UiPasswordComponent,
    UiButtonComponent,
    UiCardComponent,
    RouterLink,
    NgIf,
  ],
})
export class SigninComponent implements OnInit {
  private router = inject(Router);
  form: FormGroup;
  logo: any = null;
  submitLoading = false;
  showVerificationNotice = false;
  sellerPortalUrl = `${env.SELLER_PORTAL_URL}/register`;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private productService: ProductService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const state = history.state as { showVerificationNotice?: boolean } | null;
    this.showVerificationNotice = !!state?.showVerificationNotice;

    if (this.showVerificationNotice) {
      history.replaceState({}, '', window.location.href);
    }

    this.loadLogo();
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

  submit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitLoading = true;
    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.submitLoading = false;
        this.form.reset({ email: '', password: '' });
        this.router.navigate(['']);
      },
      error: () => {
        this.submitLoading = false;
      },
    });
  }
}
