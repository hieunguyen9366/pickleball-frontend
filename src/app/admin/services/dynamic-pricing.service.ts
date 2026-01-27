import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DynamicPricingConfig,
  DynamicPricingConfigRequest,
  PriceCalculationResponse
} from '../models/dynamic-pricing.model';
import { ApiService } from '../../common/api.service';

@Injectable({
  providedIn: 'root'
})
export class DynamicPricingService {
  constructor(private apiService: ApiService) { }

  /**
   * Lấy danh sách cấu hình giá động cho một sân
   * Backend endpoint: GET /api/courts/{courtId}/pricing
   */
  getPricingConfigsForCourt(courtId: number): Observable<DynamicPricingConfig[]> {
    return this.apiService.get<any[]>(`courts/${courtId}/pricing`).pipe(
      map(configs => configs.map(dto => this.mapDTOToConfig(dto))),
      catchError(error => {
        console.error('Error loading pricing configs:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy cấu hình giá động theo ID
   */
  getPricingConfigById(courtId: number, configId: number): Observable<DynamicPricingConfig> {
    return this.getPricingConfigsForCourt(courtId).pipe(
      map(configs => {
        const config = configs.find(c => c.configId === configId);
        if (!config) {
          throw new Error('Không tìm thấy cấu hình giá');
        }
        return config;
      }),
      catchError(error => {
        console.error('Error loading pricing config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Tạo cấu hình giá động mới
   * Backend endpoint: POST /api/courts/{courtId}/pricing
   */
  createPricingConfig(courtId: number, request: DynamicPricingConfigRequest): Observable<DynamicPricingConfig> {
    return this.apiService.post<any>(`courts/${courtId}/pricing`, request).pipe(
      map(response => this.mapDTOToConfig(response)),
      catchError(error => {
        console.error('Error creating pricing config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cập nhật cấu hình giá động
   * Backend endpoint: PUT /api/courts/{courtId}/pricing/{configId}
   */
  updatePricingConfig(courtId: number, configId: number, request: DynamicPricingConfigRequest): Observable<DynamicPricingConfig> {
    return this.apiService.put<any>(`courts/${courtId}/pricing/${configId}`, request).pipe(
      map(response => this.mapDTOToConfig(response)),
      catchError(error => {
        console.error('Error updating pricing config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Xóa cấu hình giá động
   * Backend endpoint: DELETE /api/courts/{courtId}/pricing/{configId}
   */
  deletePricingConfig(courtId: number, configId: number): Observable<boolean> {
    return this.apiService.delete<void>(`courts/${courtId}/pricing/${configId}`).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error deleting pricing config:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Tính giá cho một khung giờ cụ thể
   * This is a client-side calculation based on configs
   */
  calculatePrice(courtId: number, hour: number, basePrice: number, date?: Date): Observable<PriceCalculationResponse> {
    return this.getPricingConfigsForCourt(courtId).pipe(
      map(configs => {
        const dayOfWeek = this.getDayOfWeek(date || new Date());
        const hourStr = `${hour.toString().padStart(2, '0')}:00`;

        // Find matching config
        for (const config of configs) {
          // Check if day matches
          if (!config.daysOfWeek.includes(dayOfWeek)) {
            continue;
          }

          // Check if time is in range
          if (this.isTimeInRange(hourStr, config.timeStart, config.timeEnd)) {
            const hourType: 'PEAK' | 'NORMAL' | 'OFF_PEAK' =
              config.priceModifier > 1.0 ? 'PEAK' :
                (config.priceModifier < 1.0 ? 'OFF_PEAK' : 'NORMAL');

            return {
              basePrice,
              calculatedPrice: basePrice * config.priceModifier,
              priceModifier: config.priceModifier,
              hourType,
              configId: config.configId
            };
          }
        }

        // No matching config, return normal price
        return {
          basePrice,
          calculatedPrice: basePrice,
          priceModifier: 1.0,
          hourType: 'NORMAL' as const
        };
      }),
      catchError(error => {
        console.error('Error calculating price:', error);
        // Fallback to normal price on error
        return throwError(() => error);
      })
    );
  }

  /**
   * Map từ backend DTO sang frontend model
   */
  private mapDTOToConfig(dto: any): DynamicPricingConfig {
    if (!dto) {
      throw new Error('Invalid pricing config data');
    }

    return {
      configId: dto.configId || dto.config_id,
      courtId: dto.courtId || dto.court_id,
      timeStart: dto.timeStart || dto.time_start,
      timeEnd: dto.timeEnd || dto.time_end,
      daysOfWeek: dto.daysOfWeek || dto.days_of_week || 'MON,TUE,WED,THU,FRI,SAT,SUN',
      priceModifier: dto.priceModifier || dto.price_modifier || 1.0,
      isHoliday: dto.isHoliday !== undefined ? dto.isHoliday : (dto.is_holiday || false),
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined
    };
  }

  /**
   * Get day of week abbreviation
   */
  private getDayOfWeek(date: Date): string {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
  }

  /**
   * Check if time is in range
   */
  private isTimeInRange(time: string, startTime: string, endTime: string): boolean {
    const timeH = parseInt(time.split(':')[0], 10);
    const startH = parseInt(startTime.split(':')[0], 10);
    const endH = parseInt(endTime.split(':')[0], 10);

    if (startH <= endH) {
      return timeH >= startH && timeH < endH;
    } else {
      // Crosses midnight (e.g., 22:00 - 02:00)
      return timeH >= startH || timeH < endH;
    }
  }
}
