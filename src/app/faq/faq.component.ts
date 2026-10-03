import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { SeoService } from '../services/seo';
import { FAQ_ITEMS } from './faq.data';
import { SITE_CONTACT } from '../core/constants/site-contact';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [UiCardComponent, RouterLink],
  templateUrl: './faq.component.html',
})
export class FaqComponent implements OnInit {
  readonly items = FAQ_ITEMS;
  readonly contact = SITE_CONTACT;
  borderRadius = '12px';

  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.setFaqSeo();
  }
}
