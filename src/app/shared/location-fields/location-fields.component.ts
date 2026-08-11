import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';
import {
  LocationCity,
  LocationCountry,
  LocationService,
  LocationState,
} from '../../services/location.service';

@Component({
  selector: 'app-location-fields',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './location-fields.component.html',
  styleUrls: ['./location-fields.component.css'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class LocationFieldsComponent implements OnInit, OnDestroy {
  @Output() citySelected = new EventEmitter<string>();

  countries: LocationCountry[] = [];
  states: LocationState[] = [];
  cities: LocationCity[] = [];

  countryNames: string[] = [];
  stateNames: string[] = [];
  cityNames: string[] = [];

  loadingCountries = true;
  private destroy$ = new Subject<void>();

  constructor(
    public parent: FormGroupDirective,
    private locationService: LocationService,
  ) {}

  ngOnInit(): void {
    this.loadCountries();

    this.parent.form
      .get('city')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.citySelected.emit(String(value || '').trim());
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get showCountryError(): boolean {
    return this.hasError('country');
  }

  get showStateError(): boolean {
    return this.hasError('state');
  }

  get showCityError(): boolean {
    return this.hasError('city');
  }

  private hasError(controlName: string): boolean {
    const control = this.parent.form.get(controlName);
    return Boolean(control?.invalid && (control.dirty || control.touched));
  }

  private loadCountries(): void {
    this.loadingCountries = true;
    this.locationService.getCountries().subscribe({
      next: (res) => {
        this.countries = res.countries || [];
        this.countryNames = this.countries.map((item) => item.name);
        this.loadingCountries = false;
        this.syncFromFormValues();
      },
      error: () => {
        this.countries = [];
        this.countryNames = [];
        this.loadingCountries = false;
      },
    });
  }

  private syncFromFormValues(): void {
    const country = String(this.parent.form.get('country')?.value || '').trim();
    const state = String(this.parent.form.get('state')?.value || '').trim();

    if (!country) return;

    const matchedCountry = this.findByName(this.countries, country);
    if (!matchedCountry) return;

    this.locationService.getStatesByCountry(matchedCountry._id).subscribe({
      next: (res) => {
        this.states = res.states || [];
        this.stateNames = this.states.map((item) => item.name);
        if (!state) return;

        const matchedState = this.findByName(this.states, state);
        if (!matchedState) return;

        this.loadCitiesForState(matchedState._id);
      },
    });
  }

  onCountrySelected(name: string): void {
    const value = String(name || '').trim();
    this.parent.form.patchValue({ country: value, state: '', city: '' });
    this.states = [];
    this.cities = [];
    this.stateNames = [];
    this.cityNames = [];

    const matched = this.findByName(this.countries, value);
    if (!matched) return;

    this.locationService.getStatesByCountry(matched._id).subscribe({
      next: (res) => {
        this.states = res.states || [];
        this.stateNames = this.states.map((item) => item.name);
      },
    });
  }

  onStateSelected(name: string): void {
    const value = String(name || '').trim();
    const country = String(this.parent.form.get('country')?.value || '').trim();
    this.parent.form.patchValue({ country, state: value, city: '' });
    this.cities = [];
    this.cityNames = [];

    const matched = this.findByName(this.states, value);
    if (!matched) return;

    this.loadCitiesForState(matched._id);
  }

  onCitySelected(name: string): void {
    const value = String(name || '').trim();
    const country = String(this.parent.form.get('country')?.value || '').trim();
    const state = String(this.parent.form.get('state')?.value || '').trim();
    this.parent.form.patchValue({ country, state, city: value });
    this.citySelected.emit(value);
  }

  filterOptions(options: string[], query: string): string[] {
    const normalized = String(query || '').trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(normalized),
    );
  }

  private loadCitiesForState(stateId: string): void {
    this.locationService.getCitiesByState(stateId).subscribe({
      next: (res) => {
        this.cities = res.cities || [];
        this.cityNames = this.cities.map((item) => item.name);
      },
    });
  }

  private findByName<T extends { name: string }>(
    list: T[],
    name: string,
  ): T | undefined {
    const normalized = String(name || '').trim().toLowerCase();
    return list.find((item) => item.name.toLowerCase() === normalized);
  }
}
