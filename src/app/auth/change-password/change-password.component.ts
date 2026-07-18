import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiInputComponent } from '../../shared/ui-input/ui-input.component';
import { UiPasswordComponent } from '../../shared/ui-password/ui-password.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-change-password',
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
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  otpSent = false;
  loading = false;
  userEmail = '';

  form: FormGroup = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/signin']);
    }
  }

  sendOtp(): void {
    this.loading = true;
    this.auth.sendPasswordOtp().subscribe({
      next: (res: any) => {
        this.otpSent = true;
        this.userEmail = res.data?.email || '';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.auth.changePasswordWithOtp(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.auth.logout();
        this.router.navigate(['/signin']);
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
