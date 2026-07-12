// signup.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiPasswordComponent } from '../../shared/ui-password/ui-password.component';
import { UiInputComponent } from '../../shared/ui-input/ui-input.component';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { AuthService } from '../auth.service';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SpinnerService } from '../../shared/spinner.service';
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
export class SignupComponent {
  form: FormGroup;
  logo: any = null;
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private spinnerService: SpinnerService,
    private productService: ProductService,
  ) {
    // ✅ Form initialization yahan ho raha hai
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
        if (res.success) {
          this.logo = res.logo;
        }
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  // ✅ Submit method
  submit() {
    this.spinnerService.show();
    if (this.form.valid) {
      this.auth.signup(this.form.value).subscribe({
        next: (res) => {
          console.log('Signup success', res);

          // ✅ Reset the form
          this.form.reset({
            name: '',
            email: '',
            password: '',
            country: '',
            state: '',
            city: '',
            terms: false,
          });
          this.spinnerService.hide();
        },
        error: (err) => console.error('Signup error', err),
      });
    } else {
      console.log('Form Invalid');
      this.form.markAllAsTouched();
      this.spinnerService.hide();
    }
  }
}
