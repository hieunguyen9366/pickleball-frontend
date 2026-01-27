import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../../common/services/toast.service';
import { ApiService } from '../../common/api.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);
  const apiService = inject(ApiService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Với 401, không xử lý ở đây - để auth interceptor xử lý refresh token trước
      // Chỉ log và throw lại để auth interceptor có thể xử lý
      if (error.status === 401 && !error.url?.includes('/auth/refresh')) {
        // Không xử lý 401 ở đây, để auth interceptor xử lý refresh token
        // Chỉ throw lại để auth interceptor catch
        return throwError(() => error);
      }

      // Sử dụng ApiService.extractErrorMessage() để thống nhất cách extract error
      let errorMessage = apiService.extractErrorMessage(error);

      // Xử lý các trường hợp đặc biệt
      switch (error.status) {
        case 401:
          // Chỉ xử lý 401 cho refresh token endpoint (refresh thất bại)
          if (error.url?.includes('/auth/refresh')) {
            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            toastService.error(errorMessage, 'Phiên đăng nhập hết hạn');
            router.navigate(['/player/login']);
          }
          break;
        case 403:
          errorMessage = 'Bạn không có quyền truy cập.';
          toastService.error(errorMessage, 'Không có quyền');
          break;
        case 500:
          toastService.error(errorMessage, 'Lỗi máy chủ');
          break;
        default:
          // Error message đã được extract từ ApiService
          break;
      }

      // Show toast for errors
      // 401, 403, 500 đã được xử lý ở trên với title riêng
      // Các lỗi khác hiển thị toast với message chung
      if (error.status !== 401 && error.status !== 403 && error.status !== 500) {
        // Chỉ hiển thị toast cho các lỗi quan trọng (400, 404, 500+, network errors)
        if (error.status === 0 || error.status >= 400) {
          toastService.error(errorMessage);
        }
      }

      console.error('HTTP Error:', errorMessage);

      // Giữ nguyên HttpErrorResponse để các component có thể xử lý status code
      // Chỉ wrap trong Error nếu không phải HttpErrorResponse
      if (error instanceof HttpErrorResponse) {
        return throwError(() => error);
      }
      return throwError(() => new Error(errorMessage));
    })
  );
};


