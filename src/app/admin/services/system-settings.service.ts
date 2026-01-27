import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { SystemSettings, SystemSettingsRequest, PaymentMethodConfig } from '../models/system-settings.model';
import { PaymentMethod } from '../../player/models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {
  private readonly API_URL = '/api/system/settings';
  private readonly USE_DEMO_DATA = false;
  private readonly STORAGE_KEY = 'system_settings';

  constructor(private http: HttpClient) {
    this.initializeDemoData();
  }

  /**
   * Khởi tạo demo data cho cấu hình hệ thống
   */
  private initializeDemoData(): void {
    if (!this.USE_DEMO_DATA) return;

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) return; // Đã có data, không cần tạo lại

    const demoSettings: SystemSettings = {
      settingsId: 1,
      minPrice: 50000, // 50k/giờ
      maxPrice: 500000, // 500k/giờ
      paymentMethods: [
        {
          method: PaymentMethod.CREDIT_CARD,
          enabled: true,
          displayName: 'Thẻ tín dụng/Ghi nợ',
          description: 'Thanh toán qua thẻ Visa, Mastercard'
        },
        {
          method: PaymentMethod.MOMO,
          enabled: true,
          displayName: 'Ví MoMo',
          description: 'Thanh toán qua ví điện tử MoMo'
        },
        {
          method: PaymentMethod.BANK_TRANSFER,
          enabled: true,
          displayName: 'Tiền mặt',
          description: 'Thanh toán bằng tiền mặt khi đến sân'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(demoSettings));
  }

  /**
   * Lấy cấu hình hệ thống
   */
  getSettings(): Observable<SystemSettings> {
    if (this.USE_DEMO_DATA) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return of(JSON.parse(stored)).pipe(delay(300));
      }
      // Return default if not found
      return of({
        minPrice: 50000,
        maxPrice: 500000,
        paymentMethods: []
      } as SystemSettings).pipe(delay(300));
    }

    return this.http.get<SystemSettings>(this.API_URL);
  }

  /**
   * Cập nhật cấu hình hệ thống
   */
  updateSettings(request: SystemSettingsRequest): Observable<SystemSettings> {
    if (this.USE_DEMO_DATA) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const current: SystemSettings = stored ? JSON.parse(stored) : {};

      const updated: SystemSettings = {
        ...current,
        ...request,
        settingsId: current.settingsId || 1,
        updatedAt: new Date()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      return of(updated).pipe(delay(400));
    }

    return this.http.put<SystemSettings>(this.API_URL, request);
  }
}

