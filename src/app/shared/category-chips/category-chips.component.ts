import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HomeCategoryChip } from '../../core/services/home-page.service';

@Component({
  selector: 'app-category-chips',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './category-chips.component.html',
  styleUrl: './category-chips.component.css',
})
export class CategoryChipsComponent {
  @Input() categories: HomeCategoryChip[] = [];
  @Input() selectedId = '';
  @Output() selectedChange = new EventEmitter<string>();

  select(id: string): void {
    this.selectedChange.emit(id);
  }
}
