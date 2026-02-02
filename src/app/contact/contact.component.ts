import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiInputComponent } from '../shared/ui-input/ui-input.component';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { ContactService } from '../services/contact.service';
import { SpinnerService } from '../shared/spinner.service';
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    UiCardComponent,
    UiInputComponent,
    ReactiveFormsModule,

    MatIconModule,
  ],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  borderRadius = '8px'; // for ui-card
  contactForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private spinner: SpinnerService
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  submitForm() {
    if (this.contactForm.valid) {
      this.spinner.show();
      this.contactService.submitContact(this.contactForm.value).subscribe({
        next: (res) => {
          // ✅ response toastr service me already handle ho raha hai
          this.contactForm.reset();
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        },
      });
    } else {
      this.contactForm.markAllAsTouched();
    }
  }
}
