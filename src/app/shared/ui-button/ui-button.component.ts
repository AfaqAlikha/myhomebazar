import { NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-ui-button',
  templateUrl: './ui-button.component.html',
  styleUrls: ['./ui-button.component.css'],
  imports: [MatIconModule, NgIf],
})
export class UiButtonComponent {
  @Input() label = 'Button';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() icon?: string;
  @Input() variant: 'primary' | 'accent' | 'success' | 'danger' = 'primary';

  @Output() clicked = new EventEmitter<Event>();

  onClick(e: Event) {
    if (!this.disabled) this.clicked.emit(e);
  }
}
