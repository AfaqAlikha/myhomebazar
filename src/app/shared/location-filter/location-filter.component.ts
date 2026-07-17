import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export interface LocationFilters {
  country: string;
  state: string;
  city: string;
}

@Component({
  selector: 'app-location-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent],
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
        this.countries = data.countries || [];
        this.states = data.states || [];
        this.cities = data.cities || [];
      },
    });
  }

  apply(): void {
    this.filterChange.emit({
      country: this.country,
      state: this.state,
      city: this.city,
    });
  }

  reset(): void {
    this.country = '';
    this.state = '';
    this.city = '';
    this.filterChange.emit({ country: '', state: '', city: '' });
  }
}
