export interface ApiResponse<T> {
  data: T;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
