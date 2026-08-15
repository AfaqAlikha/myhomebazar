import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
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
    this.attachValidators();

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
    return this.shouldShowError('country');
  }

  get showStateError(): boolean {
    return this.shouldShowError('state');
  }

  get showCityError(): boolean {
    return this.shouldShowError('city');
  }

  getCountryErrorMessage(): string {
    return this.getErrorMessage('country', 'Country');
  }

  getStateErrorMessage(): string {
    return this.getErrorMessage('state', 'State');
  }

  getCityErrorMessage(): string {
    return this.getErrorMessage('city', 'City');
  }

  private shouldShowError(controlName: string): boolean {
    const control = this.parent.form.get(controlName);
    return Boolean(control?.invalid && (control.dirty || control.touched));
  }

  private getErrorMessage(controlName: string, label: string): string {
    const control = this.parent.form.get(controlName);
    if (!control?.errors) return '';
    if (control.errors['required']) return `${label} is required`;
    if (control.errors['invalidLocation']) {
      return `Select a valid ${label.toLowerCase()} from the list`;
    }
    return `${label} is invalid`;
  }

  private attachValidators(): void {
    this.parent.form.get('country')?.addValidators(this.listValidator(() => this.countryNames));
    this.parent.form.get('state')?.addValidators(this.listValidator(() => this.stateNames));
    this.parent.form.get('city')?.addValidators(this.listValidator(() => this.cityNames));
  }

  private listValidator(optionsFn: () => string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value || '').trim();
      if (!value) return null;
      const options = optionsFn();
      if (!options.length) return null;
      const matched = options.some(
        (option) => option.toLowerCase() === value.toLowerCase(),
      );
      return matched ? null : { invalidLocation: true };
    };
  }

  private loadCountries(): void {
    this.loadingCountries = true;
    this.locationService.getCountries().subscribe({
      next: (res) => {
        this.countries = res.countries || [];
        this.countryNames = this.countries.map((item) => item.name);
        this.loadingCountries = false;
        this.syncFromFormValues();
        this.refreshValidation(['country', 'state', 'city']);
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
        this.refreshValidation(['state', 'city']);
        if (!state) return;

        const matchedState = this.findByName(this.states, state);
        if (!matchedState) return;

        this.loadCitiesForState(matchedState._id);
      },
    });
  }

  onCountryBlur(): void {
    this.markTouched('country');
  }

  onStateBlur(): void {
    this.markTouched('state');
  }

  onCityBlur(): void {
    this.markTouched('city');
  }

  onCountrySelected(name: string): void {
    const value = String(name || '').trim();
    this.parent.form.patchValue({ country: value, state: '', city: '' });
    this.states = [];
    this.cities = [];
    this.stateNames = [];
    this.cityNames = [];
    this.refreshValidation(['country', 'state', 'city']);

    const matched = this.findByName(this.countries, value);
    if (!matched) return;

    this.locationService.getStatesByCountry(matched._id).subscribe({
      next: (res) => {
        this.states = res.states || [];
        this.stateNames = this.states.map((item) => item.name);
        this.refreshValidation(['state', 'city']);
      },
    });
  }

  onStateSelected(name: string): void {
    const value = String(name || '').trim();
    const country = String(this.parent.form.get('country')?.value || '').trim();
    this.parent.form.patchValue({ country, state: value, city: '' });
    this.cities = [];
    this.cityNames = [];
    this.refreshValidation(['state', 'city']);

    const matched = this.findByName(this.states, value);
    if (!matched) return;

    this.loadCitiesForState(matched._id);
  }

  onCitySelected(name: string): void {
    const value = String(name || '').trim();
    const country = String(this.parent.form.get('country')?.value || '').trim();
    const state = String(this.parent.form.get('state')?.value || '').trim();
    this.parent.form.patchValue({ country, state, city: value });
    this.refreshValidation(['city']);
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
        this.refreshValidation(['city']);
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

  private markTouched(controlName: string): void {
    const control = this.parent.form.get(controlName);
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  private refreshValidation(controlNames: string[]): void {
    controlNames.forEach((name) => {
      this.parent.form.get(name)?.updateValueAndValidity({ emitEvent: false });
    });
  }
}
