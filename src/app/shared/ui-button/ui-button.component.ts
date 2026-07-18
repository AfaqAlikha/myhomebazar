import { NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ui-button',
  templateUrl: './ui-button.component.html',
  styleUrls: ['./ui-button.component.css'],
  imports: [MatIconModule, NgIf, MatProgressSpinnerModule],
})
export class UiButtonComponent {
  @Input() label = 'Button';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() icon?: string;
  @Input() variant: 'primary' | 'accent' | 'success' | 'danger' = 'primary';

  @Output() clicked = new EventEmitter<Event>();

  onClick(e: Event): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(e);
    }
  }
}
