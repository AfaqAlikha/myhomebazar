import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(private titleService: Title, private metaService: Meta) {}

  /**
   * Set SEO Meta tags dynamically
   */
  setMeta(data: SeoData) {
    // Page title
    this.titleService.setTitle(data.title);

    // Standard meta
    this.metaService.updateTag({ name: 'description', content: data.description });
    if (data.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: data.keywords });
    }

    // Open Graph for social sharing
    if (data.url) this.metaService.updateTag({ property: 'og:url', content: data.url });
    this.metaService.updateTag({ property: 'og:title', content: data.title });
    this.metaService.updateTag({ property: 'og:description', content: data.description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    if (data.image) this.metaService.updateTag({ property: 'og:image', content: data.image });

    // Twitter Card
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: data.title });
    this.metaService.updateTag({ name: 'twitter:description', content: data.description });
    if (data.image) this.metaService.updateTag({ name: 'twitter:image', content: data.image });
  }

  /**
   * Default SEO for homepage
   */
  setDefaultSeo() {
    this.setMeta({
      title: 'MyHouseBazar – Online Shopping in Pakistan',
      description:
        'Shop furniture, home decor, kitchen items, electronics & more at MyHouseBazar. Fast delivery across Pakistan with best prices.',
      keywords:
        'myhousebazar, online shopping pakistan, ecommerce, home decor, furniture, kitchen, electronics, pakistan online store, buy online, home accessories, bedding, lighting, sofa, dining table, curtains, modern home, affordable furniture, interior decor, home essentials, pakistan bazar',
      url: 'https://www.myhousebazar.com',
      image: 'https://www.myhousebazar.com/assets/seo/home-banner.jpg',
    });
  }
}
