import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, NgIf],

  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent implements OnInit {
  logo: any = null;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.getLogo();
  }

  getLogo(): void {
    this.productService.getAppLogo().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.logo = res.logo;
        }
      },
      error: (err) => {
        console.error('Logo fetch failed:', err);
      },
    });
  }
}
