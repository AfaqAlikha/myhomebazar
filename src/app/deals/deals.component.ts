import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProductCardComponent } from '../shared/card/product-card/product-card.component';
import { ProductService } from '../services/product.service';
import { SeoService } from '../services/seo';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [NgFor, NgIf, MatPaginatorModule, ProductCardComponent],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.css',
})
export class DealsComponent implements OnInit {
  products: any[] = [];
  isLoading = true;
  noProducts = false;
  totalItems = 0;
  itemsPerPage = 12;
  currentPage = 1;

  constructor(
    private productService: ProductService,
    private seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Flash Deals & Promotions | MyHomeBazar',
      description: 'Browse active promoted products, limited-time offers, and flash deals on MyHomeBazar.',
      url: 'https://www.myhomebazar.com/deals',
    });
    this.fetchProducts();
  }

  fetchProducts(): void {
    this.isLoading = true;
    this.productService
      .getProducts({
        page: this.currentPage,
        limit: this.itemsPerPage,
        promoted: true,
        sort: 'deals',
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
