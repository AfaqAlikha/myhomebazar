import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  SearchSuggestCategory,
  SearchSuggestProduct,
  SearchSuggestResult,
  SearchSuggestSeller,
  SearchSuggestSubCategory,
} from '../../core/services/search-suggest.service';

@Component({
  selector: 'app-header-search-suggest-panel',
  standalone: true,
  imports: [MatIconModule, DecimalPipe],
  templateUrl: './header-search-suggest-panel.component.html',
  styleUrl: './header-search-suggest-panel.component.css',
})
export class HeaderSearchSuggestPanelComponent {
  @Input() query = '';
  @Input() loading = false;
  @Input() result: SearchSuggestResult | null = null;
  @Input() recent: string[] = [];
  @Input() showRecent = false;
  @Input() activeKey = '';

  @Output() keywordPick = new EventEmitter<string>();
  @Output() recentPick = new EventEmitter<string>();
  @Output() clearRecent = new EventEmitter<void>();
  @Output() productPick = new EventEmitter<SearchSuggestProduct>();
  @Output() categoryPick = new EventEmitter<SearchSuggestCategory>();
  @Output() subCategoryPick = new EventEmitter<SearchSuggestSubCategory>();
  @Output() brandPick = new EventEmitter<string>();
  @Output() sellerPick = new EventEmitter<SearchSuggestSeller>();

  recentKey(index: number): string {
    return `recent:${index}`;
  }

  productKey(index: number): string {
    return `product:${index}`;
  }

  categoryKey(index: number): string {
    return `category:${index}`;
  }

  subCategoryKey(index: number): string {
    return `subcategory:${index}`;
  }

  brandKey(index: number): string {
    return `brand:${index}`;
  }

  sellerKey(index: number): string {
    return `seller:${index}`;
  }
}
