import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { ProductService } from '../services/product.service';
import { HomePageService } from '../core/services/home-page.service';
import { SeoService } from '../services/seo';

@Component({
  selector: 'app-free-delivery',
  standalone: true,
  imports: [NgFor, NgIf, MatPaginatorModule, ProductCardComponent],
  templateUrl: './free-delivery.component.html',
  styleUrl: './free-delivery.component.css',
})
export class FreeDeliveryComponent implements OnInit {
  products: any[] = [];
  isLoading = true;
  noProducts = false;
  totalItems = 0;
  itemsPerPage = 12;
  currentPage = 1;
  bannerMessage = 'Products with free delivery from sellers on MyHomeBazar.';

  constructor(
    private productService: ProductService,
    private homePageService: HomePageService,
    private seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Free Delivery Products | MyHomeBazar',
      description: 'Shop products with free delivery across Pakistan on MyHomeBazar.',
      url: 'https://www.myhomebazar.com/free-delivery',
    });

    this.homePageService.getPublicHome().subscribe({
      next: (data) => {
        this.bannerMessage =
          data?.freeDelivery?.message
          || data?.freeDelivery?.subtitle
          || this.bannerMessage;
      },
    });

    this.fetchProducts();
  }

  fetchProducts(): void {
    this.isLoading = true;
    this.productService
      .getProducts({
        page: this.currentPage,
        limit: this.itemsPerPage,
        freeDelivery: true,
      })
      .subscribe({
        next: (res) => {
          this.products = res.products || [];
          this.totalItems = res.pagination?.totalItems || 0;
          this.itemsPerPage = res.pagination?.itemsPerPage || this.itemsPerPage;
          this.currentPage = res.pagination?.currentPage || this.currentPage;
          this.noProducts = !this.products.length;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.noProducts = true;
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.fetchProducts();
  }
}
