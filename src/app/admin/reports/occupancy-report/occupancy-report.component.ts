import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { PieChartOutline, CalendarOutline } from '@ant-design/icons-angular/icons';
import { ReportService } from '../../services/report.service';
import { OccupancyReport, RevenueReportRequest } from '../../models/report.model';
import { CourtService } from '../../../player/services/court.service';
import { CourtGroup } from '../../../player/models/court.model';
import { ApiService } from '../../../common/api.service';
import { ToastService } from '../../../common/services/toast.service';

@Component({
  selector: 'app-occupancy-report',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, IconDirective],
  templateUrl: './occupancy-report.component.html',
  styleUrls: ['./occupancy-report.component.scss']
})
export class OccupancyReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private courtService = inject(CourtService);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  report: OccupancyReport | null = null;
  isLoading = false;
  error = '';

  period: 'day' | 'month' | 'year' = 'month';
  startDate: string = this.getFirstDayOfMonth();
  endDate: string = this.getTodayDate();
  selectedCourtGroupId?: number;

  courtGroups: CourtGroup[] = [];
  currentUser = { id: 1, role: 'ADMIN' };

  constructor() {
    this.iconService.addIcon(PieChartOutline, CalendarOutline);
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.loadCourtGroups();
    this.loadReport();
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getFirstDayOfMonth(): string {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  }

  loadCourtGroups(): void {
    this.courtService.getCourtGroups(this.currentUser.role === 'MANAGER' ? this.currentUser.id : undefined).subscribe({
      next: (groups) => {
        this.courtGroups = groups;
      },
      error: (err) => {
        console.error('Error loading court groups:', err);
      }
    });
  }

  loadReport(): void {
    this.isLoading = true;
    this.error = '';

    const request: RevenueReportRequest = {
      startDate: this.startDate,
      endDate: this.endDate,
      period: this.period,
      courtGroupId: this.selectedCourtGroupId,
      managerId: this.currentUser.role === 'MANAGER' ? this.currentUser.id : undefined
    };

    this.reportService.getOccupancyReport(request).subscribe({
      next: (report) => {
        this.report = report;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading occupancy report:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải báo cáo tỷ lệ lấp đầy. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi tải báo cáo');
        this.report = null;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange(): void {
    this.loadReport();
  }
}

