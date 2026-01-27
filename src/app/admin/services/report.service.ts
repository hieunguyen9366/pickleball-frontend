import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  RevenueReport,
  RevenueReportRequest,
  OccupancyReport,
  OccupancyReportRequest,
  TopCourtsReport,
  TopCourtsReportRequest
} from '../models/report.model';
import { ApiService } from '../../common/api.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private apiService: ApiService) { }

  /**
   * Lấy báo cáo doanh thu
   */
  getRevenueReport(request: RevenueReportRequest): Observable<RevenueReport> {
    const params: any = {};

    if (request.startDate) params.startDate = request.startDate;
    if (request.endDate) params.endDate = request.endDate;
    if (request.period) params.period = request.period;
    if (request.courtGroupId) params.courtGroupId = request.courtGroupId;
    if (request.courtId) params.courtId = request.courtId;
    if (request.managerId) params.managerId = request.managerId;

    return this.apiService.get<RevenueReport>('reports/revenue', { params }).pipe(
      catchError(error => {
        console.error('Error loading revenue report:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy báo cáo tỷ lệ lấp đầy
   */
  getOccupancyReport(request: OccupancyReportRequest): Observable<OccupancyReport> {
    const params: any = {};

    if (request.startDate) params.startDate = request.startDate;
    if (request.endDate) params.endDate = request.endDate;
    if (request.period) params.period = request.period;
    if (request.courtGroupId) params.courtGroupId = request.courtGroupId;
    if (request.courtId) params.courtId = request.courtId;

    return this.apiService.get<OccupancyReport>('reports/occupancy', { params }).pipe(
      catchError(error => {
        console.error('Error loading occupancy report:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy báo cáo Top cụm sân
   */
  getTopCourtsReport(request: TopCourtsReportRequest): Observable<TopCourtsReport> {
    const params: any = {};

    if (request.startDate) params.startDate = request.startDate;
    if (request.endDate) params.endDate = request.endDate;
    if (request.period) params.period = request.period;
    if (request.limit) params.limit = request.limit;

    return this.apiService.get<TopCourtsReport>('reports/top-courts', { params }).pipe(
      catchError(error => {
        console.error('Error loading top courts report:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Xuất báo cáo ra Excel
   */
  exportToExcel(report: RevenueReport): Observable<Blob> {
    return this.apiService.downloadFile('reports/revenue/export/excel', {
      params: {
        startDate: report.startDate,
        endDate: report.endDate,
        period: report.period
      }
    }).pipe(
      catchError(error => {
        console.error('Error exporting to Excel:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Xuất báo cáo ra PDF
   */
  exportToPDF(report: RevenueReport): Observable<Blob> {
    return this.apiService.downloadFile('reports/revenue/export/pdf', {
      params: {
        startDate: report.startDate,
        endDate: report.endDate,
        period: report.period
      }
    }).pipe(
      catchError(error => {
        console.error('Error exporting to PDF:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy thống kê Dashboard
   */
  getDashboardStats(): Observable<import('../models/report.model').DashboardStats> {
    return this.apiService.get<import('../models/report.model').DashboardStats>('reports/dashboard').pipe(
      catchError(error => {
        console.error('Error loading dashboard stats:', error);
        return throwError(() => error);
      })
    );
  }
}

