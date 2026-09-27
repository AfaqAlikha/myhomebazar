import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiInputComponent } from '../../shared/ui-input/ui-input.component';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-complete-social-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    UiButtonComponent,
    UiInputComponent,
    UiCardComponent,
    RouterLink,
  ],
  templateUrl: './complete-social-profile.component.html',
  styleUrls: ['./complete-social-profile.component.css'],
})
export class CompleteSocialProfileComponent implements OnInit {
  form: FormGroup;
  pendingToken = '';
  submitLoading = false;
  profilePreview: { name?: string; email?: string } = {};

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      country: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    const state = history.state as {
      pendingToken?: string;
      profile?: { name?: string; email?: string };
    } | null;

    this.pendingToken =
      state?.pendingToken ||
      this.route.snapshot.queryParamMap.get('pendingToken') ||
      sessionStorage.getItem('socialPendingToken') ||
      '';

    if (!this.pendingToken) {
      this.router.navigate(['/signin']);
      return;
    }

    sessionStorage.setItem('socialPendingToken', this.pendingToken);
    this.profilePreview = state?.profile || {};
    this.form.patchValue({
      name: this.profilePreview.name || '',
      email: this.profilePreview.email || '',
    });
  }

  submit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.submitLoading = true;
    this.auth
      .completeSocialProfile({
        pendingToken: this.pendingToken,
        name: raw.name,
        country: raw.country,
        state: raw.state,
        city: raw.city,
        terms: raw.terms,
      })
      .subscribe({
        next: () => {
          sessionStorage.removeItem('socialPendingToken');
          this.submitLoading = false;
          this.router.navigate(['']);
        },
        error: () => {
          this.submitLoading = false;
        },
      });
  }
}
