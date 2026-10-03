import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { SeoService } from '../services/seo';
import { getGuideBySlug } from './guides.data';
import { GuideArticle } from './guides.model';

@Component({
  selector: 'app-guide-detail',
  standalone: true,
  imports: [UiCardComponent, RouterLink],
  templateUrl: './guide-detail.component.html',
})
export class GuideDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  article: GuideArticle | undefined;
  borderRadius = '12px';

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.article = getGuideBySlug(slug);
    if (this.article) {
      this.seo.setGuideDetailSeo(this.article);
    } else {
      this.seo.setNotFoundSeo();
    }
  }
}
