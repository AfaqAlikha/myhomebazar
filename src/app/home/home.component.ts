import { Component, OnInit } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { HomeHeroComponent } from '../shared/hero/hero.component';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { CategoryLinksComponent } from '../shared/category-links/category-links.component';

import { NgFor, NgIf } from '@angular/common';
import { ProductService } from '../services/product.service';
import { SpinnerService } from '../shared/spinner.service';
import { SeoService } from '../services/seo';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HomeHeroComponent,
    CategoryLinksComponent,
    ProductCardComponent,
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
  page: number = 1;

  // these will come from backend
  totalItems: number = 0;
  itemsPerPage: number = 0;
  isLoading: boolean = true;
  constructor(
    private productService: ProductService,
    private spinnerService: SpinnerService,
    private seo: SeoService
  ) {}

  ngOnInit(): void {
    this.seo.setDefaultSeo();
    this.loadHomeProducts();
    this.loadFeaturedProducts();
  }
  

  loadHomeProducts() {
    this.isLoading = true;
    this.spinnerService.show();
    this.productService.getHomeProducts(this.page).subscribe({
      next: (res: any) => {
        this.products = res.products;

        // dynamically set pagination info from backend
        this.totalItems = res.pagination.totalItems;
        this.itemsPerPage = res.pagination.itemsPerPage;
        this.page = res.pagination.currentPage;
        this.isLoading = false;
        this.spinnerService.hide();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.spinnerService.hide();
      },
    });
  }

  loadFeaturedProducts() {
    this.isLoading = true;
    this.spinnerService.show();
    this.productService.getFeaturedProducts().subscribe({
      next: (res) => {
        this.featured = res.products;
        this.isLoading = false;
        this.spinnerService.hide();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = true;
        this.spinnerService.hide();
      },
    });
  }

  
  pageChanged(event: PageEvent) {
    // Angular Material pageIndex is 0-based, backend uses 1-based
    this.page = event.pageIndex + 1;
    this.loadHomeProducts();
  }
}
