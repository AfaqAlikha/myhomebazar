import { Component, Input } from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-ui-password',
  standalone: true,
  templateUrl: './ui-password.component.html',
  styleUrls: ['./ui-password.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    NgIf,
  ],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class UiPasswordComponent {
  @Input() label: string = 'Password';
  @Input() controlName!: string;
  @Input() disabled: boolean = false;

  hide: boolean = true;

  constructor(public parent: FormGroupDirective) {}

  get control(): FormControl {
    return this.parent.form.get(this.controlName) as FormControl;
  }

  get showError(): boolean {
    return (
      this.control?.invalid && (this.control?.dirty || this.control?.touched)
    );
  }

  toggle(): void {
    this.hide = !this.hide;
  }
}
