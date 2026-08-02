import { Injectable, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Product } from '../core/models/product.model';

export interface SeoData {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  imageAlt?: string;
  type?: string;
  robots?: string;
  price?: number;
  currency?: string;
  availability?: string;
}

const SITE_URL = 'https://www.myhomebazar.com';
const SITE_NAME = 'MyHomeBazar';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  private normalizeImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
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
    const ogType = data.type || 'website';

    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:title', content: data.title });
    this.metaService.updateTag({ property: 'og:description', content: data.description });
    this.metaService.updateTag({ property: 'og:type', content: ogType });
    this.metaService.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.metaService.updateTag({ property: 'og:locale', content: 'en_PK' });

    if (data.image) {
      const image = this.normalizeImageUrl(data.image);
      this.metaService.updateTag({ property: 'og:image', content: image });
      this.metaService.updateTag({ property: 'og:image:secure_url', content: image });
      this.metaService.updateTag({ property: 'og:image:alt', content: data.imageAlt || data.title });
      this.metaService.updateTag({ property: 'og:image:width', content: '1200' });
      this.metaService.updateTag({ property: 'og:image:height', content: '630' });
      this.metaService.updateTag({ property: 'og:image:type', content: 'image/jpeg' });
      this.metaService.updateTag({ name: 'twitter:image', content: image });
      this.metaService.updateTag({ name: 'twitter:image:alt', content: data.imageAlt || data.title });
    }

    if (typeof data.price === 'number' && !Number.isNaN(data.price)) {
      this.metaService.updateTag({
        property: 'product:price:amount',
        content: String(data.price),
      });
      this.metaService.updateTag({
        property: 'product:price:currency',
        content: data.currency || 'PKR',
      });
      this.metaService.updateTag({
        property: 'product:availability',
        content: data.availability || 'in stock',
      });
      this.metaService.updateTag({
        property: 'product:condition',
        content: 'new',
      });
    }

    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: data.title });
    this.metaService.updateTag({ name: 'twitter:description', content: data.description });
    this.metaService.updateTag({ name: 'twitter:site', content: '@myhomebazar' });

    this.setCanonical(url);
  }

  setOrganizationBranding(logo: { image?: string; siteName?: string; themeColor?: string }): void {
    if (!logo?.image) return;

    const logoUrl = this.normalizeImageUrl(logo.image);
    this.setFavicon(logoUrl);
    this.setAppleTouchIcon(logoUrl);

    this.metaService.updateTag({ property: 'og:image', content: logoUrl });
    this.metaService.updateTag({ property: 'og:image:secure_url', content: logoUrl });
    this.metaService.updateTag({ property: 'og:image:alt', content: logo.siteName || SITE_NAME });
    this.metaService.updateTag({ name: 'twitter:image', content: logoUrl });

    if (logo.themeColor) {
      this.metaService.updateTag({ name: 'theme-color', content: logo.themeColor });
    }

    this.setJsonLdById('seo-organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: logo.siteName || SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 512,
        height: 512,
      },
      image: logoUrl,
    });
  }

  setDefaultSeo(): void {
    this.setMeta({
      title: 'MyHomeBazar – Online Shopping in Pakistan',
      description:
        'Shop furniture, home decor, kitchen items, electronics & more at MyHomeBazar. Fast delivery across Pakistan with best prices.',
      keywords:
        'myhomebazar, online shopping pakistan, ecommerce, home decor, furniture, kitchen, electronics',
      url: SITE_URL,
      type: 'website',
    });
    this.setJsonLdById('seo-website', {
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
      type: 'website',
    });
  }

  setProductSeo(product: Product): void {
    const desc = (product.description || '').slice(0, 160);
    const title = `${product.name}${product.brand ? ' – ' + product.brand : ''} | MyHomeBazar`;
    const url = `${SITE_URL}/product/details/${product._id}`;
    const image = product.images?.[0];

    this.setMeta({
      title,
      description: desc,
      url,
      image,
      imageAlt: product.name,
      type: 'website',
      price: Number(product.price),
      currency: 'PKR',
      availability: Number(product.countInStock ?? 0) > 0 ? 'in stock' : 'out of stock',
    });

    const graph: Record<string, unknown>[] = [
      {
        '@type': 'Product',
        name: product.name,
        description: desc,
        image: (product.images || []).map((img) => this.normalizeImageUrl(img)),
        brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'PKR',
          availability:
            Number(product.countInStock ?? 0) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url,
        },
        aggregateRating: product.averageRating
          ? {
              '@type': 'AggregateRating',
              ratingValue: product.averageRating,
              bestRating: 5,
            }
          : undefined,
      },
    ];

    if (product.catName) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: product.catName },
          { '@type': 'ListItem', position: 3, name: product.name, item: url },
        ],
      });
    }

    this.setJsonLdById('seo-product', {
      '@context': 'https://schema.org',
      '@graph': graph,
    });
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
      type: 'website',
    });

    this.setJsonLdById('seo-category', {
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
      type: 'website',
    });
  }

  setAboutSeo(): void {
    this.setMeta({
      title: 'About Us | MyHomeBazar',
      description: "Learn about MyHomeBazar – Pakistan's trusted online marketplace.",
      url: `${SITE_URL}/about`,
      type: 'website',
    });
  }

  setContactSeo(): void {
    this.setMeta({
      title: 'Contact Us | MyHomeBazar',
      description: 'Get in touch with MyHomeBazar customer support.',
      url: `${SITE_URL}/contact`,
      type: 'website',
    });
  }

  setPrivacyPolicySeo(): void {
    this.setMeta({
      title: 'Privacy Policy | MyHomeBazar',
      description:
        'Read how My Home Bazar collects, uses, and protects your personal information when you shop on our Pakistan marketplace.',
      url: `${SITE_URL}/privacy-policy`,
      type: 'website',
    });
  }

  setTermsSeo(): void {
    this.setMeta({
      title: 'Terms & Conditions | MyHomeBazar',
      description:
        'Terms and conditions for using My Home Bazar — orders, payments, shipping, returns, and seller rules.',
      url: `${SITE_URL}/terms-and-conditions`,
      type: 'website',
    });
  }

  setNotFoundSeo(): void {
    this.setMeta({
      title: 'Page Not Found | MyHomeBazar',
      description: 'The page you are looking for does not exist.',
      url: SITE_URL,
      robots: 'noindex, nofollow',
      type: 'website',
    });
  }

  private setFavicon(href: string): void {
    this.setLinkRel('icon', href, { type: 'image/png' });
    this.setLinkRel('shortcut icon', href, { type: 'image/png' });
  }

  private setAppleTouchIcon(href: string): void {
    this.setLinkRel('apple-touch-icon', href);
  }

  private setLinkRel(
    rel: string,
    href: string,
    attrs: Record<string, string> = {},
  ): void {
    const normalizedHref = this.normalizeImageUrl(href);
    const selector = `link[rel='${rel}']`;
    let link = this.document.querySelector(selector) as HTMLLinkElement | null;

    if (!link) {
      link = this.document.createElement('link');
      link.rel = rel;
      this.document.head.appendChild(link);
    }

    link.href = normalizedHref;
    Object.entries(attrs).forEach(([key, value]) => {
      link!.setAttribute(key, value);
    });
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private setJsonLdById(id: string, data: Record<string, unknown>): void {
    let script = this.document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      script.className = 'seo-json-ld';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}
