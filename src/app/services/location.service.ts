import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../core/config/api-endpoints';

export interface LocationCountry {
  _id: string;
  name: string;
}

export interface LocationState {
  _id: string;
  name: string;
  country?: string;
}

export interface LocationCity {
  _id: string;
  name: string;
  state?: string;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  constructor(private http: HttpClient) {}

  getCountries(): Observable<{ countries: LocationCountry[] }> {
    return this.http.get<{ countries: LocationCountry[] }>(
      API_ENDPOINTS.locations.countries,
    );
  }

  getStatesByCountry(
    countryId: string,
  ): Observable<{ states: LocationState[] }> {
    return this.http.get<{ states: LocationState[] }>(
      API_ENDPOINTS.locations.statesByCountry(countryId),
    );
  }

  getCitiesByState(stateId: string): Observable<{ cities: LocationCity[] }> {
    return this.http.get<{ cities: LocationCity[] }>(
      API_ENDPOINTS.locations.citiesByState(stateId),
    );
  }
}
