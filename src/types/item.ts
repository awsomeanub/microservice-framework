export interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateItemDto {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface UpdateItemDto {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
