import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../common/api.service';

export interface CreatePaymentUrlRequest {
  bookingId: number;
  method: 'CREDIT_CARD' | 'MOMO' | 'CASH';
}

export interface PaymentCallbackResponse {
  paymentId: number;
  bookingId?: number;
  amount: number;
  paymentMethod: 'CREDIT_CARD' | 'MOMO' | 'CASH' | string;
  transactionRef: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paymentTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private apiService: ApiService) {}

  /**
   * Tạo payment URL từ payment gateway
   * @param bookingId ID của booking
   * @param method Phương thức thanh toán
   * @returns Observable<string> Payment URL
   */
  createPaymentUrl(bookingId: number, method: 'CREDIT_CARD' | 'MOMO' | 'CASH'): Observable<string> {
    return this.apiService.post<string>(
      'v1/payments/create-url',
      {},
      {
        params: {
          bookingId: bookingId.toString(),
          method: method
        }
      }
    ).pipe(
      catchError(error => {
        console.error('Error creating payment URL:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Xử lý callback từ payment gateway
   * @param ref Transaction reference
   * @param status Payment status
   * @returns Observable<PaymentCallbackResponse>
   */
  processPaymentCallback(ref: string, status: string): Observable<PaymentCallbackResponse> {
    return this.apiService.get<PaymentCallbackResponse>(
      'v1/payments/callback',
      {
        params: {
          ref,
          status
        }
      }
    ).pipe(
      catchError(error => {
        console.error('Error processing payment callback:', error);
        return throwError(() => error);
      })
    );
  }
}
