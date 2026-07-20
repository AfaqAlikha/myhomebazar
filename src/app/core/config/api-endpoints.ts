import { env } from '../../../environments/env';

const BASE = env.BASE_URL;

export const API_ENDPOINTS = {
  auth: {
    signup: `${BASE}/user/signup`,
    login: `${BASE}/user/login`,
    verifyEmail: `${BASE}/user/verify-email`,
    profile: `${BASE}/user/profile`,
    profileById: (userId: string) => `${BASE}/user/profile/${userId}`,
    publicProfile: (id: string) => `${BASE}/user/public-profile/${id}`,
    sellers: `${BASE}/user/sellers`,
    updateProfile: (id: string) => `${BASE}/user/update-profile/${id}`,
    sendPasswordOtp: `${BASE}/user/password/send-otp`,
    changePasswordWithOtp: `${BASE}/user/password/change-with-otp`,
    refreshToken: `${BASE}/user/refresh-token`,
    logout: `${BASE}/user/logout`,
  },
  products: {
    list: `${BASE}/products`,
    locations: `${BASE}/products/locations`,
    myProducts: `${BASE}/products/my-products`,
    byId: (id: string) => `${BASE}/products/${id}`,
    recordView: (id: string) => `${BASE}/products/${id}/view`,
    toggleLike: (id: string) => `${BASE}/products/${id}/like`,
    bySeller: (sellerId: string) => `${BASE}/products/seller/${sellerId}`,
  },
  appAssets: {
    banners: `${BASE}/app-assets/public/banners`,
    logo: `${BASE}/app-assets/public/logo`,
  },
  category: {
    list: `${BASE}/category`,
    subcategories: (id: string) => `${BASE}/category/${id}/subcategories`,
    childSubcategories: (id: string) => `${BASE}/category/${id}/child-subcategories`,
  },
  cart: {
    add: `${BASE}/cart/add`,
    myCart: `${BASE}/cart/my-cart`,
    remove: (itemId: string) => `${BASE}/cart/remove/${itemId}`,
    updateQuantity: (itemId: string) => `${BASE}/cart/update-quantity/${itemId}`,
    checkout: `${BASE}/cart/checkout`,
    confirmPayment: `${BASE}/cart/confirm-payment`,
    sessionMetadata: (sessionId: string) => `${BASE}/cart/session-metadata/${sessionId}`,
  },
  productOrder: {
    create: `${BASE}/productOrder`,
    confirmPayment: `${BASE}/productOrder/confirm-payment`,
    byProduct: (productId: string) => `${BASE}/productOrder/${productId}`,
    orders: `${BASE}/productOrder/orders`,
    update: (id: string) => `${BASE}/productOrder/${id}`,
    review: (id: string) => `${BASE}/productOrder/${id}/review`,
  },
  wishlist: {
    list: `${BASE}/wishlistproducts`,
    add: `${BASE}/wishlistproducts/add`,
    remove: (productId: string) => `${BASE}/wishlistproducts/remove/${productId}`,
    clear: `${BASE}/wishlistproducts/clear`,
  },
  contact: {
    submit: `${BASE}/contact`,
  },
  claims: {
    create: `${BASE}/claims`,
    list: `${BASE}/claims`,
    byId: (id: string) => `${BASE}/claims/${id}`,
  },
  payments: {
    confirm: `${BASE}/payments/confirm`,
  },
  promotions: {
    plans: `${BASE}/promotions/plans`,
    subscribe: `${BASE}/promotions/subscribe`,
    mySubscription: `${BASE}/promotions/my-subscription`,
    apply: `${BASE}/promotions/apply`,
    myProducts: `${BASE}/promotions/my-products`,
  },
  theme: {
    public: `${BASE}/theme/public`,
  },
  shipping: {
    quote: `${BASE}/shipping/quote`,
    tracking: (orderId: string) => `${BASE}/shipping/orders/${orderId}/tracking`,
    syncTracking: (orderId: string) => `${BASE}/shipping/orders/${orderId}/tracking/sync`,
  },
} as const;

export const CLAIM_REASONS = [
  { value: 'wrong_product', label: 'Wrong Product' },
  { value: 'damaged_product', label: 'Damaged Product' },
  { value: 'missing_item', label: 'Missing Item' },
  { value: 'fake_product', label: 'Fake Product' },
  { value: 'defective_product', label: 'Defective Product' },
  { value: 'refund_request', label: 'Refund Request' },
  { value: 'exchange_request', label: 'Exchange Request' },
  { value: 'other', label: 'Other' },
] as const;
