import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { GuestGuard } from './auth/guest.guard';

export const routes: Routes = [
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup.component').then((m) => m.SignupComponent),
    canActivate: [GuestGuard],
  },
  {
    path: 'signin',
    loadComponent: () => import('./auth/signin/signin.component').then((m) => m.SigninComponent),
    canActivate: [GuestGuard],
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./auth/email-verification/email-verification.component').then(
        (m) => m.EmailVerificationComponent,
      ),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact/contact.component').then((m) => m.ContactComponent),
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./wishlist/wishlist.component').then((m) => m.WishlistComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'product/details/:id',
    loadComponent: () =>
      import('./product-details/product-details.component').then((m) => m.ProductDetailsComponent),
  },
  {
    path: 'category/:slug/:id',
    loadComponent: () => import('./category/category.component').then((m) => m.CategoryComponent),
  },

  {
    path: 'shop',
    loadComponent: () => import('./shop/shop.component').then((m) => m.ShopComponent),
  },
  {
    path: 'payment-success',
    loadComponent: () =>
      import('./payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent),
  },
  {
    path: 'payment-success-cart',
    loadComponent: () =>
      import('./payment-success-cart/payment-success-cart.component').then(
        (m) => m.PaymentSuccessCartComponent,
      ),
  },
  {
    path: 'my-acount',
    loadComponent: () =>
      import('./my-account/my-account.component').then((m) => m.MyAccountComponent),
  },
  {
    path: 'profile/:id',
    loadComponent: () =>
      import('./seller-profile/seller-profile.component').then((m) => m.SellerProfileComponent),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./page-not-found/page-not-found.component').then((m) => m.PageNotFoundComponent),
  },
];
