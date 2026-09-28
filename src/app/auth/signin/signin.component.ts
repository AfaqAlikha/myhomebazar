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
import { SocialAuthButtonsComponent } from '../social-auth-buttons/social-auth-buttons.component';

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
    SocialAuthButtonsComponent,
  ],
})
export class SigninComponent implements OnInit {
  private router = inject(Router);
  form: FormGroup;
  logo: any = null;
  submitLoading = false;
  socialLoading = false;
  showVerificationNotice = false;

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

  onGoogleToken(idToken: string): void {
    this.socialLoading = true;
    this.auth.googleAuth(idToken).subscribe({
      next: (res) => {
        this.socialLoading = false;
        this.auth.handleSocialAuthResponse(res);
        if (!res.needsProfile) this.router.navigate(['']);
      },
      error: () => {
        this.socialLoading = false;
      },
    });
  }

  onFacebookToken(accessToken: string): void {
    this.socialLoading = true;
    this.auth.facebookAuth(accessToken).subscribe({
      next: (res) => {
        this.socialLoading = false;
        this.auth.handleSocialAuthResponse(res);
        if (!res.needsProfile) this.router.navigate(['']);
      },
      error: () => {
        this.socialLoading = false;
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
