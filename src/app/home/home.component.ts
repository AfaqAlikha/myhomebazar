import { Component, OnInit } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { HeroSwiperComponent } from '../shared/components/hero-swiper/hero-swiper.component';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { CategoryLinksComponent } from '../shared/category-links/category-links.component';
import {
  LocationFilterComponent,
  LocationFilters,
} from '../shared/location-filter/location-filter.component';

import { NgFor, NgIf } from '@angular/common';
import { ProductService } from '../services/product.service';
import { SpinnerService } from '../shared/spinner.service';
import { SeoService } from '../services/seo';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSwiperComponent,
    CategoryLinksComponent,
    ProductCardComponent,
    LocationFilterComponent,
    NgFor,
    MatPaginatorModule,
    NgIf,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  featured: any[] = [];
  products: any[] = [];
  page = 1;

  totalItems = 0;
  itemsPerPage = 0;
  isLoading = true;
  heroLoading = true;

  locationFilters: LocationFilters = { country: '', state: '', city: '' };

  constructor(
    private productService: ProductService,
    private spinnerService: SpinnerService,
    private seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.seo.setDefaultSeo();
    this.loadHomeProducts();
    this.loadFeaturedProducts();
  }

  onLocationFilter(filters: LocationFilters): void {
    this.locationFilters = filters;
    this.page = 1;
    this.loadHomeProducts();
  }

  loadHomeProducts(): void {
    this.isLoading = true;
    this.spinnerService.show();
    this.productService.getHomeProducts(this.page, this.locationFilters).subscribe({
      next: (res: any) => {
        this.products = res.products;
        this.totalItems = res.pagination.totalItems;
        this.itemsPerPage = res.pagination.itemsPerPage;
        this.page = res.pagination.currentPage;
        this.isLoading = false;
        this.spinnerService.hide();
      },
      error: () => {
        this.isLoading = false;
        this.spinnerService.hide();
      },
    });
  }

  loadFeaturedProducts(): void {
    this.heroLoading = true;

    this.productService.getFeaturedProducts().subscribe({
      next: (res: any) => {
        const banners = res.banners || [];

        const productBanners: any[] = [];
        const imageBanners: any[] = [];

        banners.forEach((banner: any) => {
          if (banner.productId) {
            productBanners.push({
              ...banner.productId,
              bannerType: 'product',
              bannerImage: banner.productId.images?.[0],
            });
          } else {
            banner.images?.forEach((img: string) => {
              imageBanners.push({
                bannerType: 'image',
                bannerImage: img,
              });
            });
          }
        });

        this.featured = [...productBanners, ...imageBanners];
        this.heroLoading = false;
      },
      error: () => {
        this.heroLoading = false;
      },
    });
  }

  pageChanged(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.loadHomeProducts();
  }
}
