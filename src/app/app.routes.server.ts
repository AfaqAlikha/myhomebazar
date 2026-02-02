import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ✅ Public SEO pages
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    path: 'home',
    renderMode: RenderMode.Server,
  },
  {
    path: 'shop',
    renderMode: RenderMode.Server,
  },
  {
    path: 'about',
    renderMode: RenderMode.Server,
  },
  {
    path: 'contact',
    renderMode: RenderMode.Server,
  },

  // ✅ Dynamic but SEO-relevant
  {
    path: 'product/details/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'category/:slug/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'profile/:id',
    renderMode: RenderMode.Server,
  },

  // ❌ Auth & user-specific (CSR only)
  {
    path: 'signup',
    renderMode: RenderMode.Client,
  },
  {
    path: 'signin',
    renderMode: RenderMode.Client,
  },
  {
    path: 'verify-email',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my-acount',
    renderMode: RenderMode.Client,
  },

  // ❌ Cart / Payment (user data)
  {
    path: 'cart',
    renderMode: RenderMode.Client,
  },
  {
    path: 'wishlist',
    renderMode: RenderMode.Client,
  },
  {
    path: 'payment-success',
    renderMode: RenderMode.Client,
  },
  {
    path: 'payment-success-cart',
    renderMode: RenderMode.Client,
  },

  // ❌ 404 LAST
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
