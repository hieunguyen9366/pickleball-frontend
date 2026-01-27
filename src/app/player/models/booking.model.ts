import { Court } from './court.model';
import { Service } from './service.model';
import { Payment } from './payment.model';

export interface Booking {
  bookingId: number;
  userId: number;
  userName?: string;
  courtId: number;
  courtName?: string;
  courtGroupName?: string;
  court?: Court;
  bookingDate: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
  totalPrice: number;
  status: BookingStatus;
  paymentStatus?: string;
  services?: BookingService[];
  payment?: Payment;
  checkedInAt?: Date; // Thời gian check-in
  createdAt?: Date;
  updatedAt?: Date;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export interface BookingService {
  id?: number; // Backend trả về 'id' thay vì 'bookingServiceId'
  bookingServiceId?: number;
  bookingId?: number;
  serviceId: number;
  serviceName?: string; // Backend trả về serviceName trực tiếp
  service?: Service; // Optional - có thể không có nếu backend chỉ trả về serviceName
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateBookingRequest {
  courtId: number;
  bookingDate: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
  services?: BookingServiceRequest[];
  // Demo-only field cho FE tính tổng tiền; backend có thể tự tính lại
  totalPrice?: number;
}

export interface BookingServiceRequest {
  serviceId: number;
  quantity: number;
}

export interface BookingListRequest {
  userId?: number;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  managerId?: number; // Add manager scope
  page?: number;
  pageSize?: number;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CancelBookingRequest {
  bookingId: number;
  reason?: string;
}

export interface CancelBookingResponse {
  success: boolean;
  refundAmount?: number;
  refundMethod?: string;
  message: string;
}

