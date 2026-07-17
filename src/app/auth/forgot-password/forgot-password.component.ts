import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiInputComponent } from '../../shared/ui-input/ui-input.component';
import { UiPasswordComponent } from '../../shared/ui-password/ui-password.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    UiCardComponent,
    UiButtonComponent,
    UiInputComponent,
    UiPasswordComponent,
  ],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  step = 1;
  loading = false;
  message = '';

  emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm: FormGroup = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  sendOtp(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.auth.sendPasswordOtp(this.emailForm.value.email).subscribe({
      next: () => {
        this.step = 2;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { otp, newPassword, confirmPassword } = this.resetForm.value;
    this.loading = true;

    this.auth
      .changePasswordWithOtp({
        email: this.emailForm.value.email,
        otp,
        newPassword,
        confirmPassword,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/signin']);
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  resendOtp(): void {
    this.sendOtp();
  }
}
