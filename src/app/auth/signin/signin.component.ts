import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiPasswordComponent } from '../../shared/ui-password/ui-password.component';
import { UiInputComponent } from '../../shared/ui-input/ui-input.component';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { AuthService } from '../auth.service';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

import { SpinnerService } from '../../shared/spinner.service';
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
  ],
})
export class SigninComponent {
  private router = inject(Router);
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private spinnerService: SpinnerService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit() {
    this.spinnerService.show();
    if (this.form.valid) {
      this.auth.login(this.form.value).subscribe({
        next: (res) => {
          this.form.reset({
            email: '',
            password: '',
          });
          this.spinnerService.hide();
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.spinnerService.hide();
          console.error(err);
        },
      });
    } else {
      console.log('Form Invalid');
      this.form.markAllAsTouched();
      this.spinnerService.hide();
    }
  }
}
