export interface Court {
  courtId: number;
  courtName: string;
  courtGroupId: number;
  courtGroupName?: string;
  location: string;
  district?: string;
  city?: string;
  pricePerHour: number;
  status: CourtStatus;
  images?: string[];
  description?: string;
  amenities?: string[];
  phone?: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Slot info (when searching with date/time)
  slotId?: number;
  slotDate?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  isLocked?: boolean;
  lockedByUserId?: number;
}

export enum CourtStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE'
}

export interface CourtGroup {
  courtGroupId: number;
  courtGroupName: string;
  address: string;
  district: string;
  city: string;
  description?: string;
  managerId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimeSlot {
  slotId?: number;
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
  isAvailable: boolean;
  price?: number;
  isLocked?: boolean; // true nếu đang bị lock
  lockedByUserId?: number; // ID của user đang giữ lock, undefined nếu không bị lock
}

export interface CourtSearchRequest {
  searchTerm?: string; // Search in courtName, address, district, city
  district?: string;
  city?: string;
  courtGroupId?: number;
  date?: string; // Format: YYYY-MM-DD
  startTime?: string; // Format: HH:mm
  endTime?: string; // Format: HH:mm
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: string[]; // List of service names
  sortBy?: 'default' | 'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc';
  status?: CourtStatus;
  page?: number;
  pageSize?: number;
}

export interface CourtSearchResponse {
  courts: Court[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CourtDetail extends Court {
  availableTimeSlots: TimeSlot[];
  reviews?: CourtReview[];
  averageRating?: number;
}

export interface CourtReview {
  reviewId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

/**
 * Kết quả tìm kiếm với TimeSlot cụ thể
 * Mỗi TimeSlot là 1 kết quả riêng biệt
 */
export interface CourtWithTimeSlot extends Court {
  timeSlot: TimeSlot; // Khung giờ cụ thể
  slotStartTime: string; // Format: HH:mm
  slotEndTime: string; // Format: HH:mm
  slotPrice: number; // Giá của khung giờ này
  totalPriceForTime?: number; // Giữ để tương thích với template (optional)
}

