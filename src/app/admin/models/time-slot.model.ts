import { TimeSlot } from '../../player/models/court.model';

/**
 * Cấu hình Khung giờ cho Sân hoặc Cụm sân
 */
export interface TimeSlotConfig {
  configId?: number;
  courtId?: number; // Nếu null thì áp dụng cho cả cụm sân
  courtGroupId?: number; // Nếu null thì áp dụng cho sân cụ thể
  openTime: string; // Format: HH:mm (VD: "05:00")
  closeTime: string; // Format: HH:mm (VD: "23:00")
  slotDuration: number; // Độ dài mỗi slot (phút): 30 hoặc 60
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Request để tạo/cập nhật cấu hình khung giờ
 */
export interface TimeSlotConfigRequest {
  courtId?: number;
  courtGroupId?: number;
  openTime: string;
  closeTime: string;
  slotDuration: number;
  isActive: boolean;
}

/**
 * Response khi lấy danh sách cấu hình khung giờ
 */
export interface TimeSlotConfigListResponse {
  configs: TimeSlotConfig[];
  total: number;
}

/**
 * Time Slot với thông tin đầy đủ (bao gồm giá)
 */
export interface TimeSlotDetail extends TimeSlot {
  configId?: number;
  courtId?: number;
  courtGroupId?: number;
  date?: string; // Format: YYYY-MM-DD
  isBooked?: boolean;
  bookingId?: number;
}



