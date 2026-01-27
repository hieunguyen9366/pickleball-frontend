import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, tap } from 'rxjs';

// Biến để quản lý việc refresh token đang diễn ra (dùng module-level để share giữa các request)
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Thêm token vào header nếu có
  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: any) => {
      // Đảm bảo error là HttpErrorResponse
      if (!(error instanceof HttpErrorResponse)) {
        console.warn('[AuthInterceptor] Error is not HttpErrorResponse:', error);
        return throwError(() => error);
      }
      
      const status = error.status;
      const isRetryAfterRefresh = clonedReq.headers.has('X-Retry-After-Refresh');
      const isRefreshEndpoint = clonedReq.url.includes('/auth/refresh');
      
      console.log('[AuthInterceptor] Error caught:', {
        url: clonedReq.url,
        status: status,
        errorType: error?.constructor?.name,
        isHttpErrorResponse: error instanceof HttpErrorResponse,
        isRefreshEndpoint,
        isRetryAfterRefresh,
        isRefreshing,
        errorStatus: error.status,
        errorMessage: error.message
      });
      
      // Chỉ xử lý 401 (Unauthorized) - token hết hạn hoặc không hợp lệ
      // Không xử lý cho request refresh token để tránh loop vô hạn
      // Không xử lý cho request đã retry sau refresh
      if (status === 401 && !isRefreshEndpoint && !isRetryAfterRefresh) {
        console.log('[AuthInterceptor] Processing 401 for:', clonedReq.url);
        
        // Nếu đang refresh token, đợi kết quả và retry request
        if (isRefreshing) {
          console.log('[AuthInterceptor] Already refreshing, waiting for new token...');
          return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap((newToken) => {
              console.log('[AuthInterceptor] Got new token, retrying request:', clonedReq.url);
              // Retry request ban đầu với token mới và đánh dấu là retry
              const retryReq = clonedReq.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                  'X-Retry-After-Refresh': 'true'
                }
              });
              return next(retryReq);
            })
          );
        }

        // Bắt đầu refresh token
        console.log('[AuthInterceptor] Starting token refresh...');
        isRefreshing = true;
        refreshTokenSubject.next(null);

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.warn('[AuthInterceptor] No refresh token available, logging out...');
          // Không có refresh token, logout và throw error
          isRefreshing = false;
          refreshTokenSubject.next(null);
          authService.logout();
          return throwError(() => error);
        }

        return authService.refreshToken().pipe(
          tap(() => console.log('[AuthInterceptor] Token refresh successful')),
          switchMap((authResponse) => {
            // Refresh thành công
            isRefreshing = false;
            const newToken = authResponse.token;
            refreshTokenSubject.next(newToken);
            
            console.log('[AuthInterceptor] Retrying original request with new token:', clonedReq.url);
            // Retry request ban đầu với token mới và đánh dấu là retry để tránh loop
            const retryReq = clonedReq.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
                'X-Retry-After-Refresh': 'true'
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh thất bại - logout và throw error
            console.error('[AuthInterceptor] Token refresh failed:', refreshError);
            isRefreshing = false;
            refreshTokenSubject.next(null);
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      // Các lỗi khác (403, 500, etc.) hoặc đã xử lý, throw error để error interceptor xử lý
      return throwError(() => error);
    })
  );
};


