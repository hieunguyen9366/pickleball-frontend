import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../common/api.service';

export interface ReserveSlotsRequest {
  slotIds: number[];
  minutes?: number;
}

export interface ReserveSlotResponse {
  slotId: number;
  expiresInMinutes: number;
}

export interface ReserveSlotsResponse {
  slotIds: number[];
  expiresInMinutes: number;
}

export interface SlotLockStatus {
  slotId: number;
  isLocked: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TimeSlotLockService {
  constructor(private apiService: ApiService) {}

  /**
   * Reserve (lock) một time slot
   * @param slotId ID của time slot
   * @param minutes Thời gian lock (mặc định 5 phút)
   * @returns Observable<ReserveSlotResponse>
   */
  reserveSlot(slotId: number, minutes: number = 5): Observable<ReserveSlotResponse> {
    return this.apiService.post<ReserveSlotResponse>(
      `v1/time-slots/${slotId}/reserve`,
      {},
      {
        params: {
          minutes: minutes.toString()
        }
      }
    ).pipe(
      catchError(error => {
        console.error('Error reserving slot:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Reserve (lock) nhiều time slots
   * @param slotIds Danh sách ID của time slots
   * @param minutes Thời gian lock (mặc định 5 phút)
   * @returns Observable<ReserveSlotsResponse>
   */
  reserveSlots(slotIds: number[], minutes: number = 5): Observable<ReserveSlotsResponse> {
    const request: ReserveSlotsRequest = {
      slotIds,
      minutes
    };
    return this.apiService.post<ReserveSlotsResponse>(
      'v1/time-slots/reserve',
      request
    ).pipe(
      catchError(error => {
        console.error('Error reserving slots:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Release lock của một slot
   * @param slotId ID của time slot
   * @returns Observable<void>
   */
  releaseSlot(slotId: number): Observable<void> {
    return this.apiService.delete<void>(`v1/time-slots/${slotId}/reserve`).pipe(
      catchError(error => {
        console.error('Error releasing slot:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Release locks của nhiều slots
   * @param slotIds Danh sách ID của time slots
   * @returns Observable<void>
   */
  releaseSlots(slotIds: number[]): Observable<void> {
    // Backend không có endpoint batch release, nên gọi từng cái
    if (slotIds.length === 0) {
      return new Observable(observer => {
        observer.next();
        observer.complete();
      });
    }

    const releases = slotIds.map(slotId => this.releaseSlot(slotId));
    return new Observable(observer => {
      let completed = 0;
      let hasError = false;

      releases.forEach(release => {
        release.subscribe({
          next: () => {
            completed++;
            if (completed === releases.length && !hasError) {
              observer.next();
              observer.complete();
            }
          },
          error: (error) => {
            if (!hasError) {
              hasError = true;
              observer.error(error);
            }
          }
        });
      });
    });
  }

  /**
   * Gia hạn lock của một slot
   * @param slotId ID của time slot
   * @param minutes Thời gian gia hạn thêm (mặc định 5 phút)
   * @returns Observable<ReserveSlotResponse>
   */
  extendReservation(slotId: number, minutes: number = 5): Observable<ReserveSlotResponse> {
    return this.apiService.put<ReserveSlotResponse>(
      `v1/time-slots/${slotId}/reserve/extend`,
      {},
      {
        params: {
          minutes: minutes.toString()
        }
      }
    ).pipe(
      catchError(error => {
        console.error('Error extending reservation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Kiểm tra lock status của một slot
   * @param slotId ID của time slot
   * @returns Observable<SlotLockStatus>
   */
  getSlotLockStatus(slotId: number): Observable<SlotLockStatus> {
    return this.apiService.get<SlotLockStatus>(`v1/time-slots/${slotId}/reserve/status`).pipe(
      catchError(error => {
        console.error('Error getting lock status:', error);
        return throwError(() => error);
      })
    );
  }
}

