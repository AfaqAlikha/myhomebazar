import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { Product } from '../core/models/product.model';

export interface SeoData {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  robots?: string;
}

const SITE_URL = 'https://www.myhomebazar.com';
const SITE_NAME = 'MyHomeBazar';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private isBrowser: boolean;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  setMeta(data: SeoData): void {
    this.titleService.setTitle(data.title);
    this.metaService.updateTag({ name: 'description', content: data.description });

    if (data.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: data.keywords });
    }

    if (data.robots) {
      this.metaService.updateTag({ name: 'robots', content: data.robots });
    }

    const url = data.url || SITE_URL;
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:title', content: data.title });
    this.metaService.updateTag({ property: 'og:description', content: data.description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: SITE_NAME });
    if (data.image) {
      this.metaService.updateTag({ property: 'og:image', content: data.image });
    }

    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: data.title });
    this.metaService.updateTag({ name: 'twitter:description', content: data.description });
    if (data.image) {
      this.metaService.updateTag({ name: 'twitter:image', content: data.image });
    }

    this.setCanonical(url);
  }

  setDefaultSeo(): void {
    this.setMeta({
      title: 'MyHomeBazar – Online Shopping in Pakistan',
      description:
        'Shop furniture, home decor, kitchen items, electronics & more at MyHomeBazar. Fast delivery across Pakistan with best prices.',
      keywords:
        'myhomebazar, online shopping pakistan, ecommerce, home decor, furniture, kitchen, electronics',
      url: SITE_URL,
      image: `${SITE_URL}/assets/seo/home-banner.jpg`,
    });
    this.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/shop?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });
  }

  setShopSeo(): void {
    this.setMeta({
      title: 'Shop All Products | MyHomeBazar',
      description: 'Browse all products at MyHomeBazar. Filter by category, brand, and price.',
      url: `${SITE_URL}/shop`,
    });
  }

  setProductSeo(product: Product): void {
    const desc = (product.description || '').slice(0, 160);
    const title = `${product.name}${product.brand ? ' – ' + product.brand : ''} | MyHomeBazar`;
    const url = `${SITE_URL}/product/details/${product._id}`;

    this.setMeta({
      title,
      description: desc,
      url,
      image: product.images?.[0],
    });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: desc,
      image: product.images,
      brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'PKR',
        availability: 'https://schema.org/InStock',
        url,
      },
      aggregateRating: product.averageRating
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating,
            bestRating: 5,
          }
        : undefined,
    });

    if (product.catName) {
      this.setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: product.catName },
          { '@type': 'ListItem', position: 3, name: product.name, item: url },
        ],
      });
    }
  }

  setCategorySeo(categoryName: string, categoryId?: string): void {
    const url = categoryId
      ? `${SITE_URL}/category/${categoryName.toLowerCase().replace(/\s+/g, '-')}/${categoryId}`
      : `${SITE_URL}/shop`;

    this.setMeta({
      title: `${categoryName} Products | MyHomeBazar`,
      description: `Shop ${categoryName} products at MyHomeBazar. Best prices and fast delivery across Pakistan.`,
      keywords: `${categoryName}, ${categoryName} products, online shopping pakistan`,
      url,
    });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${categoryName} Products`,
      description: `Browse ${categoryName} products at MyHomeBazar`,
      url,
    });
  }

  setSellerSeo(sellerName: string, sellerId: string): void {
    const url = `${SITE_URL}/profile/${sellerId}`;
    this.setMeta({
      title: `${sellerName} Store | MyHomeBazar`,
      description: `Shop products from ${sellerName} on MyHomeBazar.`,
      url,
    });
  }

  setAboutSeo(): void {
    this.setMeta({
      title: 'About Us | MyHomeBazar',
      description: 'Learn about MyHomeBazar – Pakistan\'s trusted online marketplace.',
      url: `${SITE_URL}/about`,
    });
  }

  setContactSeo(): void {
    this.setMeta({
      title: 'Contact Us | MyHomeBazar',
      description: 'Get in touch with MyHomeBazar customer support.',
      url: `${SITE_URL}/contact`,
    });
  }

  setPrivacyPolicySeo(): void {
    this.setMeta({
      title: 'Privacy Policy | MyHomeBazar',
      description:
        'Read how My Home Bazar collects, uses, and protects your personal information when you shop on our Pakistan marketplace.',
      url: `${SITE_URL}/privacy-policy`,
    });
  }

  setTermsSeo(): void {
    this.setMeta({
      title: 'Terms & Conditions | MyHomeBazar',
      description:
        'Terms and conditions for using My Home Bazar — orders, payments, shipping, returns, and seller rules.',
      url: `${SITE_URL}/terms-and-conditions`,
    });
  }

  setNotFoundSeo(): void {
    this.setMeta({
      title: 'Page Not Found | MyHomeBazar',
      description: 'The page you are looking for does not exist.',
      url: SITE_URL,
      robots: 'noindex, nofollow',
    });
  }

  private setCanonical(url: string): void {
    if (!this.isBrowser) return;
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  private setJsonLd(data: Record<string, unknown>): void {
    if (!this.isBrowser) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.className = 'seo-json-ld';
    document.querySelectorAll('script.seo-json-ld').forEach((el) => el.remove());
    document.head.appendChild(script);
  }
}
