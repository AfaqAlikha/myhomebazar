import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiPasswordComponent } from '../../shared/ui-password/ui-password.component';
import { UiInputComponent } from '../../shared/ui-input/ui-input.component';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    UiPasswordComponent,
    UiButtonComponent,
    UiInputComponent,
    RouterLink,
    UiCardComponent,
    NgIf,
  ],
})
export class SignupComponent implements OnInit {
  form: FormGroup;
  logo: any = null;
  submitLoading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private productService: ProductService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      country: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
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
    this.auth.signup(this.form.value).subscribe({
      next: () => {
        this.submitLoading = false;
        this.router.navigate(['/signin'], {
          state: { showVerificationNotice: true },
        });
      },
      error: () => {
        this.submitLoading = false;
      },
    });
  }
}
