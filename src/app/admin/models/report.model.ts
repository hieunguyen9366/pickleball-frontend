import { Booking } from '../../player/models/booking.model';
import { CourtGroup } from '../../player/models/court.model';

/**
 * Báo cáo Doanh thu
 */
export interface RevenueReport {
  period: string; // 'day' | 'month' | 'year'
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  revenueByDate: RevenueByDate[];
  revenueByCourtGroup: RevenueByCourtGroup[];
  revenueByCourt: RevenueByCourt[];
}

export interface RevenueByDate {
  date: string; // Format: YYYY-MM-DD
  revenue: number;
  bookingCount: number;
}

export interface RevenueByCourtGroup {
  courtGroupId: number;
  courtGroupName: string;
  revenue: number;
  bookingCount: number;
}

export interface RevenueByCourt {
  courtId: number;
  courtName: string;
  revenue: number;
  bookingCount: number;
}

/**
 * Request để lấy báo cáo doanh thu
 */
export interface RevenueReportRequest {
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD
  period?: 'day' | 'month' | 'year';
  courtGroupId?: number;
  courtId?: number;
  managerId?: number; // Filter theo manager
}

/**
 * Báo cáo Tỷ lệ lấp đầy
 */
export interface OccupancyReport {
  period: string;
  startDate: string;
  endDate: string;
  totalSlots: number;
  bookedSlots: number;
  occupancyRate: number; // %
  occupancyByDate: OccupancyByDate[];
  occupancyByCourt: OccupancyByCourt[];
}

export interface OccupancyByDate {
  date: string;
  totalSlots: number;
  bookedSlots: number;
  occupancyRate: number;
}

export interface OccupancyByCourt {
  courtId: number;
  courtName: string;
  totalSlots: number;
  bookedSlots: number;
  occupancyRate: number;
}

/**
 * Request để lấy báo cáo tỷ lệ lấp đầy
 */
export interface OccupancyReportRequest {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'month' | 'year';
  courtGroupId?: number;
  courtId?: number;
}

/**
 * Top Cụm sân doanh thu
 */
export interface TopCourtsReport {
  period: string;
  startDate: string;
  endDate: string;
  topCourtGroups: RevenueByCourtGroup[];
  topCourts: RevenueByCourt[];
}

/**
 * Request để lấy báo cáo Top cụm sân
 */
export interface TopCourtsReportRequest {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'month' | 'year';
  limit?: number;
}

export interface DashboardStats {
  todayRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  todayBookings: number;
  monthBookings: number;
  totalBookings: number;
  newUsersThisMonth: number;
  totalUsers: number;
  totalCourts: number;
  activeCourts: number;
}

