/** Универсальная обёртка ответа API с полем `data`. */
export interface ApiResponse<T> {
  data: T;
}

/** Параметры постраничной выборки в запросах. */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
