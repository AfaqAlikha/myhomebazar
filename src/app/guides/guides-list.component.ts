import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { SeoService } from '../services/seo';
import { GUIDE_ARTICLES } from './guides.data';

@Component({
  selector: 'app-guides-list',
  standalone: true,
  imports: [UiCardComponent, RouterLink],
  templateUrl: './guides-list.component.html',
})
export class GuidesListComponent implements OnInit {
  readonly articles = GUIDE_ARTICLES;
  borderRadius = '12px';

  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.setGuidesListSeo();
  }
}
