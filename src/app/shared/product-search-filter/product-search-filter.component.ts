import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export interface ProductSearchFilters {
  search: string;
}

@Component({
  selector: 'app-product-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent],
  templateUrl: './product-search-filter.component.html',
  styleUrls: ['./product-search-filter.component.css'],
})
export class ProductSearchFilterComponent implements OnInit {
  @Input() initial: ProductSearchFilters = { search: '' };
  @Output() filterChange = new EventEmitter<ProductSearchFilters>();

  search = '';

  ngOnInit(): void {
    this.search = this.initial.search || '';
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.apply();
    }
  }

  apply(): void {
    this.filterChange.emit({ search: this.search.trim() });
  }

  reset(): void {
    this.search = '';
    this.filterChange.emit({ search: '' });
  }
}
