import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TimeSlotConfig, TimeSlotConfigRequest, TimeSlotConfigListResponse, TimeSlotDetail } from '../models/time-slot.model';
import { TimeSlot } from '../../player/models/court.model';
import { ApiService } from '../../common/api.service';

@Injectable({
  providedIn: 'root'
})
export class TimeSlotService {
  private readonly API_ENDPOINT = 'v1/time-slots/configs';

  constructor(private apiService: ApiService) { }

  /**
   * Lấy danh sách cấu hình khung giờ
   */
  getTimeSlotConfigs(courtId?: number, courtGroupId?: number): Observable<TimeSlotConfigListResponse> {
    const params: any = {};
    if (courtId) params.courtId = courtId;
    if (courtGroupId) params.courtGroupId = courtGroupId;

    return this.apiService.get<any[]>(this.API_ENDPOINT, { params }).pipe(
      map((configs: any[]) => ({
        configs: configs.map(dto => this.mapDTOToTimeSlotConfig(dto)),
        total: configs.length
      })),
      catchError(error => {
        console.error('Error loading time slot configs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy cấu hình khung giờ theo ID
   */
  getTimeSlotConfigById(configId: number): Observable<TimeSlotConfig> {
    return this.apiService.get<any>(`${this.API_ENDPOINT}/${configId}`).pipe(
      map(dto => this.mapDTOToTimeSlotConfig(dto)),
      catchError(error => {
        console.error('Error loading time slot config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Tạo cấu hình khung giờ mới
   */
  createTimeSlotConfig(request: TimeSlotConfigRequest): Observable<TimeSlotConfig> {
    const dto = this.mapRequestToDTO(request);

    return this.apiService.post<any>(this.API_ENDPOINT, dto).pipe(
      map(response => this.mapDTOToTimeSlotConfig(response)),
      catchError(error => {
        console.error('Error creating time slot config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cập nhật cấu hình khung giờ
   */
  updateTimeSlotConfig(configId: number, request: TimeSlotConfigRequest): Observable<TimeSlotConfig> {
    const dto = this.mapRequestToDTO(request);

    return this.apiService.put<any>(`${this.API_ENDPOINT}/${configId}`, dto).pipe(
      map(response => this.mapDTOToTimeSlotConfig(response)),
      catchError(error => {
        console.error('Error updating time slot config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Xóa cấu hình khung giờ
   */
  deleteTimeSlotConfig(configId: number): Observable<boolean> {
    return this.apiService.delete<void>(`${this.API_ENDPOINT}/${configId}`).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error deleting time slot config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy danh sách time slots cho một sân trong một ngày
   * Note: This endpoint uses CourtController, not TimeSlotConfigController
   */
  getTimeSlotsForCourt(courtId: number, date: string): Observable<TimeSlotDetail[]> {
    return this.apiService.get<TimeSlotDetail[]>(`courts/${courtId}/slots`, {
      params: { date }
    }).pipe(
      catchError(error => {
        console.error('Error loading time slots for court:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Map từ backend DTO sang frontend TimeSlotConfig model
   */
  private mapDTOToTimeSlotConfig(dto: any): TimeSlotConfig {
    if (!dto) {
      throw new Error('Invalid time slot config data');
    }

    return {
      configId: dto.configId || dto.config_id,
      courtId: dto.courtId || dto.court_id,
      courtGroupId: dto.courtGroupId || dto.court_group_id,
      openTime: this.parseTime(dto.openTime),
      closeTime: this.parseTime(dto.closeTime),
      slotDuration: dto.slotDuration || dto.slot_duration || 60,
      isActive: dto.isActive !== undefined ? dto.isActive : (dto.is_active !== undefined ? dto.is_active : true),
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined
    };
  }

  /**
   * Map từ frontend TimeSlotConfigRequest sang backend DTO
   */
  private mapRequestToDTO(request: TimeSlotConfigRequest): any {
    return {
      courtId: request.courtId || null,
      courtGroupId: request.courtGroupId || null,
      openTime: request.openTime, // Backend expects LocalTime string format "HH:mm"
      closeTime: request.closeTime,
      slotDuration: request.slotDuration,
      isActive: request.isActive
    };
  }

  /**
   * Parse time from various formats to string "HH:mm"
   */
  private parseTime(time: any): string {
    if (!time) return '05:00';

    // If already a string in correct format
    if (typeof time === 'string') {
      return time;
    }

    // If it's an array [hour, minute] from LocalTime
    if (Array.isArray(time) && time.length >= 2) {
      const hour = time[0].toString().padStart(2, '0');
      const minute = time[1].toString().padStart(2, '0');
      return `${hour}:${minute}`;
    }

    // If it's an object with hour and minute properties
    if (typeof time === 'object' && 'hour' in time && 'minute' in time) {
      const hour = time.hour.toString().padStart(2, '0');
      const minute = time.minute.toString().padStart(2, '0');
      return `${hour}:${minute}`;
    }

    return time.toString();
  }
}
