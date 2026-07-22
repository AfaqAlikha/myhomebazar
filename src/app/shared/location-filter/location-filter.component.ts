import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProductService } from '../../services/product.service';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export interface LocationFilters {
  country: string;
  state: string;
  city: string;
}

interface LocationEntry {
  country: string;
  state: string;
  city: string;
}

@Component({
  selector: 'app-location-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    UiButtonComponent,
  ],
  templateUrl: './location-filter.component.html',
  styleUrls: ['./location-filter.component.css'],
})
export class LocationFilterComponent implements OnInit {
  @Input() initial: LocationFilters = { country: '', state: '', city: '' };
  @Output() filterChange = new EventEmitter<LocationFilters>();

  country = '';
  state = '';
  city = '';

  countries: string[] = [];
  states: string[] = [];
  cities: string[] = [];
  private locations: LocationEntry[] = [];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.country = this.initial.country || '';
    this.state = this.initial.state || '';
    this.city = this.initial.city || '';
    this.loadLocations();
  }

  loadLocations(): void {
    this.productService.getProductLocations().subscribe({
      next: (data) => {
        this.locations = data.locations || [];
        this.countries = data.countries || [];
        this.refreshStateOptions();
        this.refreshCityOptions();
      },
    });
  }

  onCountryChange(value: string): void {
    this.country = value || '';
    this.state = '';
    this.city = '';
    this.refreshStateOptions();
    this.refreshCityOptions();
  }

  onStateChange(value: string): void {
    this.state = value || '';
    this.city = '';
    this.refreshCityOptions();
  }

  onCityChange(value: string): void {
    this.city = value || '';
  }

  private refreshStateOptions(): void {
    const source = this.country
      ? this.locations.filter(
          (entry) => entry.country.toLowerCase() === this.country.toLowerCase(),
        )
      : this.locations;

    this.states = this.uniqueSorted(source.map((entry) => entry.state));
  }

  private refreshCityOptions(): void {
    let source = this.locations;

    if (this.country) {
      source = source.filter(
        (entry) => entry.country.toLowerCase() === this.country.toLowerCase(),
      );
    }

    if (this.state) {
      source = source.filter(
        (entry) => entry.state.toLowerCase() === this.state.toLowerCase(),
      );
    }

    this.cities = this.uniqueSorted(source.map((entry) => entry.city));
  }

  private uniqueSorted(values: string[]): string[] {
    const seen = new Map<string, string>();

    values.forEach((value) => {
      const trimmed = String(value || '').trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!seen.has(key)) seen.set(key, trimmed);
    });

    return [...seen.values()].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
  }

  apply(): void {
    this.filterChange.emit({
      country: this.country.trim(),
      state: this.state.trim(),
      city: this.city.trim(),
    });
  }

  reset(): void {
    this.country = '';
    this.state = '';
    this.city = '';
    this.refreshStateOptions();
    this.refreshCityOptions();
    this.filterChange.emit({ country: '', state: '', city: '' });
  }
}
