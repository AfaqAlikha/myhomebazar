import { Component, OnInit } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';
import { NgFor, NgIf } from '@angular/common';
import { UiCardComponent } from '../shared/ui-card/ui-card.component';
import { SeoService } from '../services/seo';
import {
  AboutContent,
  AboutFeature,
  AboutService,
  AboutStat,
  AboutTeamMember,
} from '../services/about.service';
import { DEFAULT_ABOUT_STORY } from '../core/constants/default-about-fallback';
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  standalone: true,
  imports: [UiCardComponent, NgFor, NgIf],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('800ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('fadeLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('800ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
    trigger('fadeRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('800ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class AboutComponent implements OnInit {
  borderRadius = '8px';
  isLoading = true;
  readonly placeholderImage = '/assets/placeholder-product.png';

  story = { ...DEFAULT_ABOUT_STORY };

  deliveryStats: AboutStat[] = [
    { icon: 'store', title: '10.5k', description: 'Sellers active on our site' },
    { icon: 'attach_money', title: '33k', description: 'Monthly Product Sale' },
    { icon: 'shopping_basket', title: '45.5k', description: 'Customers active on our site' },
    { icon: 'money', title: '25k', description: 'Annual gross sale' },
  ];

  owners: AboutTeamMember[] = [];

  deliveryFeatures: AboutFeature[] = [
    {
      icon: 'local_shipping',
      title: 'FREE AND FAST DELIVERY',
      desc: 'Free delivery on eligible seller orders over Rs 5,000 where offered',
    },
    {
      icon: 'headset_mic',
      title: '24/7 CUSTOMER SERVICE',
      desc: 'Friendly 24/7 customer support',
    },
    {
      icon: 'verified',
      title: 'MONEY BACK GUARANTEE',
      desc: 'We return money within 30 days',
    },
  ];

  constructor(
    private seo: SeoService,
    private aboutService: AboutService,
  ) {}

  ngOnInit(): void {
    this.seo.setAboutSeo();
    this.aboutService.getPublicAbout().subscribe({
      next: (content) => {
        if (content) this.applyContent(content);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private applyContent(content: AboutContent): void {
    if (content.story) {
      this.story = {
        title: content.story.title || this.story.title,
        paragraphs: content.story.paragraphs?.length ? content.story.paragraphs : this.story.paragraphs,
        image: content.story.image || this.story.image,
      };
    }
    if (content.stats?.length) this.deliveryStats = content.stats;
    if (content.team?.length && !this.isPlaceholderTeam(content.team)) {
      this.owners = content.team;
    }
    if (content.features?.length) this.deliveryFeatures = content.features;
  }

  private isPlaceholderTeam(team: AboutTeamMember[]): boolean {
    const placeholderNames = new Set([
      'Team Member',
      'Tom Cruise',
      'Emma Watson',
      'Will Smith',
    ]);
    return team.some((m) => placeholderNames.has(m.name));
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.placeholderImage) {
      img.src = this.placeholderImage;
    }
  }
}
