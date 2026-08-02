import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ProductService } from '../services/product.service';
import { SeoService } from '../services/seo';
import { Product } from '../core/models/product.model';

export const productDetailsResolver: ResolveFn<Product | null> = (route) => {
  const id = route.paramMap.get('id');
  if (!id) return of(null);

  const productService = inject(ProductService);
  const seo = inject(SeoService);

  return productService.getProductById(id).pipe(
    map((res) => {
      const product = (res?.product ?? res?.data?.product ?? res) as Product | null;
      if (product?._id) {
        seo.setProductSeo(product);
      }
      return product;
    }),
    catchError(() => of(null)),
  );
};
