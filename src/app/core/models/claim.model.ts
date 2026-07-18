export type ClaimStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'resolved';

export interface Claim {
  _id: string;
  order: string | { _id: string; status?: string; totalPrice?: number };
  user: string | { _id: string; name?: string; email?: string };
  seller: string | { _id: string; name?: string; email?: string };
  product: string | { _id: string; name?: string; brand?: string; images?: string[] };
  reason: string;
  description: string;
  images: string[];
  videos: string[];
  status: ClaimStatus;
  adminNotes?: string;
  statusHistory?: Array<{
    status: ClaimStatus;
    note: string;
    changedAt: string;
  }>;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
}

export interface ClaimsListResponse {
  claims: Claim[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}
