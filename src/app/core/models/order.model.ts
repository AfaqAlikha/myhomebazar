import { Product } from './product.model';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'accepted'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface OrderReview {
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface Order {
  _id: string;
  product: Product;
  quantity: number;
  subtotal?: number;
  shippingFee?: number;
  totalPrice: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  name?: string;
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  canReview?: boolean;
  hasReviewed?: boolean;
  canClaim?: boolean;
  hasClaimed?: boolean;
  deliveredAt?: string;
  completedAt?: string;
  claimWindowDays?: number;
  claimExpiresAt?: string;
  claimDaysRemaining?: number;
  review?: OrderReview;
}
