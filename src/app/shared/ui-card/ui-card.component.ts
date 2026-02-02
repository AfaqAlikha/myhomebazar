import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-card',
  imports: [],
  templateUrl: './ui-card.component.html',
  styleUrl: './ui-card.component.css',
})
export class UiCardComponent {
  @Input() borderRadius: string = '0rem';
}
