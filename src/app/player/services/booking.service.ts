import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Booking,
  CreateBookingRequest,
  BookingListRequest,
  BookingListResponse,
  CancelBookingRequest,
  CancelBookingResponse,
  BookingStatus
} from '../models/booking.model';
import { ApiService } from '../../common/api.service';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  constructor(private apiService: ApiService) {}

  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.apiService.post<Booking>('bookings', request).pipe(
      catchError(error => {
        console.error('Error creating booking:', error);
        return throwError(() => error);
      })
    );
  }

  getBookings(request?: BookingListRequest): Observable<BookingListResponse> {
    const params: any = {
      page: request?.page || 1,
      pageSize: request?.pageSize || 10
    };

    if (request?.userId) params.userId = request.userId;
    if (request?.status) params.status = request.status;
    if (request?.startDate) params.startDate = request.startDate;
    if (request?.endDate) params.endDate = request.endDate;
    if (request?.managerId) params.managerId = request.managerId;

    return this.apiService.get<BookingListResponse>('bookings', { params }).pipe(
      catchError(error => {
        console.error('Error loading bookings:', error);
        return throwError(() => error);
      })
    );
  }

  getBookingById(bookingId: number): Observable<Booking> {
    return this.apiService.get<Booking>(`bookings/${bookingId}`).pipe(
      catchError(error => {
        console.error('Error loading booking:', error);
        return throwError(() => error);
      })
    );
  }

  cancelBooking(request: CancelBookingRequest): Observable<CancelBookingResponse> {
    return this.apiService.post<CancelBookingResponse>(
      `bookings/${request.bookingId}/cancel`,
      { reason: request.reason }
    ).pipe(
      catchError(error => {
        console.error('Error canceling booking:', error);
        return throwError(() => error);
      })
    );
  }

  updateBookingStatus(bookingId: number, status: BookingStatus): Observable<Booking> {
    return this.apiService.patch<Booking>(`bookings/${bookingId}/status`, { status }).pipe(
      catchError(error => {
        console.error('Error updating booking status:', error);
        return throwError(() => error);
      })
    );
  }

  checkIn(bookingId: number): Observable<Booking> {
    return this.apiService.post<Booking>(`bookings/${bookingId}/check-in`, {}).pipe(
      catchError(error => {
        console.error('Error checking in:', error);
        return throwError(() => error);
      })
    );
  }

  getMyBookings(page: number = 1, pageSize: number = 10): Observable<BookingListResponse> {
    return this.getBookings({ page, pageSize });
  }

  /**
   * Lấy danh sách booking cho calendar view
   */
  getBookingsForCalendar(params: {
    startDate: string;
    endDate: string;
    courtId?: number;
    managerId?: number;
  }): Observable<BookingListResponse> {
    return this.apiService.get<BookingListResponse>('bookings/calendar', { params }).pipe(
      catchError(error => {
        console.error('Error loading calendar bookings:', error);
        return throwError(() => error);
      })
    );
  }

}
