import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { LegalSection } from './legal-section.model';

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [UiCardComponent, RouterLink, NgFor, NgIf],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.css',
})
export class LegalPageComponent {
  @Input({ required: true }) pageTitle!: string;
  @Input({ required: true }) lastUpdated!: string;
  @Input({ required: true }) sections!: LegalSection[];
  @Input() intro = '';
  borderRadius = '12px';
}
