export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  errors?: string[];
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  pagination: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    pageSize?: number;
  };
}
