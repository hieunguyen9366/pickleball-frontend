/**
 * Cấu hình Giá theo Khung giờ (Dynamic Pricing)
 * Updated to match backend structure
 */
export interface DynamicPricingConfig {
  configId?: number;
  courtId: number;              // Required - backend only supports court-specific pricing
  timeStart: string;            // Format: HH:mm (e.g., "17:00")
  timeEnd: string;              // Format: HH:mm (e.g., "21:00")
  daysOfWeek: string;           // Comma-separated: "MON,TUE,WED,THU,FRI,SAT,SUN"
  priceModifier: number;        // Multiplier (e.g., 1.2 = 120%, 0.8 = 80%)
  isHoliday: boolean;           // Holiday pricing flag
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Request để tạo/cập nhật cấu hình giá
 */
export interface DynamicPricingConfigRequest {
  timeStart: string;
  timeEnd: string;
  daysOfWeek: string;
  priceModifier: number;
  isHoliday: boolean;
}

/**
 * Response khi lấy giá cho một khung giờ cụ thể
 */
export interface PriceCalculationResponse {
  basePrice: number;
  calculatedPrice: number;
  priceModifier: number;
  hourType: 'PEAK' | 'NORMAL' | 'OFF_PEAK';
  configId?: number;
}

/**
 * Helper type for days of week
 */
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'MON', label: 'Thứ 2' },
  { value: 'TUE', label: 'Thứ 3' },
  { value: 'WED', label: 'Thứ 4' },
  { value: 'THU', label: 'Thứ 5' },
  { value: 'FRI', label: 'Thứ 6' },
  { value: 'SAT', label: 'Thứ 7' },
  { value: 'SUN', label: 'Chủ nhật' }
];
