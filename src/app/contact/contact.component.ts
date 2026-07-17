import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { UiInputComponent } from '../shared/ui-input/ui-input.component';
import { UiButtonComponent } from '../shared/ui-button/ui-button.component';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ContactService } from '../services/contact.service';
import { SeoService } from '../services/seo';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    UiCardComponent,
    UiInputComponent,
    UiButtonComponent,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './contact.component.html',
})
export class ContactComponent implements OnInit {
  borderRadius = '8px';
  contactForm: FormGroup;
  submitLoading = false;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private seo: SeoService,
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.seo.setContactSeo();
  }

  submitForm(): void {
    if (!this.contactForm.valid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitLoading = true;
    this.contactService.submitContact(this.contactForm.value).subscribe({
      next: () => {
        this.submitLoading = false;
        this.contactForm.reset();
      },
      error: () => {
        this.submitLoading = false;
      },
    });
  }
}
