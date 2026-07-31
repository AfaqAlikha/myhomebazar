import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../core/config/api-endpoints';

export interface AboutStory {
  title: string;
  paragraphs: string[];
  image: string;
}

export interface AboutStat {
  icon: string;
  title: string;
  description: string;
  liveKey?: string;
}

export interface AboutTeamMember {
  img: string;
  name: string;
  role: string;
  animation: 'fadeIn' | 'fadeLeft' | 'fadeRight';
}

export interface AboutFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface AboutContent {
  story: AboutStory;
  stats: AboutStat[];
  team: AboutTeamMember[];
  features: AboutFeature[];
}

@Injectable({ providedIn: 'root' })
export class AboutService {
  constructor(private http: HttpClient) {}

  getPublicAbout(): Observable<AboutContent | null> {
    return this.http.get<{ about?: AboutContent; data?: { about?: AboutContent } }>(API_ENDPOINTS.about.public).pipe(
      map((res) => res.about || res.data?.about || null),
      catchError(() => of(null)),
    );
  }
}
