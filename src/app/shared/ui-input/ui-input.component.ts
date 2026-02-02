import { Component, Input } from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ui-input',
  standalone: true,

  templateUrl: './ui-input.component.html',
  styleUrls: ['./ui-input.component.css'],
  // ✅ only NgModules or standalone components here
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
export class UiInputComponent {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() controlName!: string;
  @Input() disabled: boolean = false;

  constructor(public parent: FormGroupDirective) {}

  get control(): FormControl {
    return this.parent.form.get(this.controlName) as FormControl;
  }

  get showError(): boolean {
    return (
      this.control?.invalid && (this.control?.dirty || this.control?.touched)
    );
  }
}
