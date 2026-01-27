/**
 * Cấu hình Hệ thống
 */
export interface SystemSettings {
  settingsId?: number;
  minPrice: number; // Giá sàn
  maxPrice: number; // Giá trần
  paymentMethods: PaymentMethodConfig[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Cấu hình Phương thức thanh toán
 */
export interface PaymentMethodConfig {
  method: string; // 'CREDIT_CARD' | 'MOMO' | 'CASH'
  enabled: boolean;
  displayName: string;
  apiKey?: string; // API key nếu cần (sẽ được mã hóa)
  apiSecret?: string; // API secret nếu cần (sẽ được mã hóa)
  description?: string;
}

/**
 * Request để cập nhật cấu hình hệ thống
 */
export interface SystemSettingsRequest {
  minPrice: number;
  maxPrice: number;
  paymentMethods: PaymentMethodConfig[];
}



