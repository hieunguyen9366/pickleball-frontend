/**
 * API Response Models
 */

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
}

/**
 * API Error Detail
 */
export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API Request Options
 */
export interface ApiRequestOptions {
  params?: { [key: string]: any };
  headers?: { [key: string]: string };
  reportProgress?: boolean;
  observe?: 'body' | 'events' | 'response';
  responseType?: 'json' | 'blob' | 'text' | 'arraybuffer';
}



