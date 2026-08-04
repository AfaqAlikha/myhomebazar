import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CategoryService, Category } from '../../services/category.service';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export interface ProductSearchFilters {
  search: string;
  categoryId: string;
  subCategoryId: string;
  sort: '' | 'low' | 'high';
}

@Component({
  selector: 'app-product-search-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    UiButtonComponent,
  ],
  templateUrl: './product-search-filter.component.html',
  styleUrls: ['./product-search-filter.component.css'],
})
export class ProductSearchFilterComponent implements OnInit {
  @Input() initial: ProductSearchFilters = {
    search: '',
    categoryId: '',
    subCategoryId: '',
    sort: '',
  };
  @Output() filterChange = new EventEmitter<ProductSearchFilters>();

  search = '';
  categoryId = '';
  subCategoryId = '';
  sort: '' | 'low' | 'high' = '';

  categories: Category[] = [];
  subCategories: Array<{ _id: string; subCategory: string }> = [];

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.search = this.initial.search || '';
    this.categoryId = this.initial.categoryId || '';
    this.subCategoryId = this.initial.subCategoryId || '';
    this.sort = this.initial.sort || '';

    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        if (this.categoryId) {
          this.loadSubCategories(this.categoryId, false);
        }
      },
    });
  }

  onCategoryChange(categoryId: string): void {
    this.categoryId = categoryId || '';
    this.subCategoryId = '';
    this.subCategories = [];

    if (this.categoryId) {
      this.loadSubCategories(this.categoryId, false);
    }
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.apply();
    }
  }

  apply(): void {
    this.filterChange.emit(this.currentFilters());
  }

  reset(): void {
    this.search = '';
    this.categoryId = '';
    this.subCategoryId = '';
    this.sort = '';
    this.subCategories = [];
    this.filterChange.emit(this.currentFilters());
  }

  private loadSubCategories(categoryId: string, emitOnLoad: boolean): void {
    this.categoryService.getSubCategories(categoryId).subscribe({
      next: (subs) => {
        this.subCategories = subs || [];
        if (emitOnLoad) {
          this.apply();
        }
      },
    });
  }

  private currentFilters(): ProductSearchFilters {
    return {
      search: this.search.trim(),
      categoryId: this.categoryId,
      subCategoryId: this.subCategoryId,
      sort: this.sort,
    };
  }
}
