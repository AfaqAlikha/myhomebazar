export interface ProductReview {
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string };
}

export interface ProductUser {
  _id: string;
  name: string;
  bio?: string;
}

export interface Product {
  _id: string;
  user: ProductUser | string;
  name: string;
  description: string;
  images: string[];
  price: number;
  brand?: string;
  catName?: string;
  averageRating: number;
  colors?: string[];
  sizes?: string[];
  mobileRam?: string[];
  wordSizes?: string[];
  numberSizes?: string[];
  reviews?: ProductReview[];
  awaitingReviewUsers?: string[];
  isAwaitingReview?: boolean;
}
