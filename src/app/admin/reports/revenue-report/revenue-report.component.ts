import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { 
  DollarOutline, 
  CalendarOutline, 
  FileExcelOutline,
  FilePdfOutline,
  DownloadOutline
} from '@ant-design/icons-angular/icons';
import { ReportService } from '../../services/report.service';
import { RevenueReport, RevenueReportRequest } from '../../models/report.model';
import { CourtService } from '../../../player/services/court.service';
import { CourtGroup } from '../../../player/models/court.model';
import { ApiService } from '../../../common/api.service';
import { ToastService } from '../../../common/services/toast.service';

@Component({
  selector: 'app-revenue-report',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, IconDirective],
  templateUrl: './revenue-report.component.html',
  styleUrls: ['./revenue-report.component.scss']
})
export class RevenueReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private courtService = inject(CourtService);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  report: RevenueReport | null = null;
  isLoading = false;
  error = '';

  // Filter
  period: 'day' | 'month' | 'year' = 'month';
  startDate: string = this.getFirstDayOfMonth();
  endDate: string = this.getTodayDate();
  selectedCourtGroupId?: number;

  courtGroups: CourtGroup[] = [];

  // Chart data
  chartData: any = null;

  // Mock User Context
  currentUser = { id: 1, role: 'ADMIN' };

  constructor() {
    this.iconService.addIcon(DollarOutline, CalendarOutline, FileExcelOutline, FilePdfOutline, DownloadOutline);
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

    this.reportService.getRevenueReport(request).subscribe({
      next: (report) => {
        this.report = report;
        this.prepareChartData();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading revenue report:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải báo cáo doanh thu. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi tải báo cáo');
        this.report = null;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  prepareChartData(): void {
    if (!this.report || !this.report.revenueByDate || this.report.revenueByDate.length === 0) {
      this.chartData = null;
      return;
    }

    this.chartData = {
      series: [{
        name: 'Doanh thu',
        data: this.report.revenueByDate.map(r => r.revenue || 0)
      }],
      categories: this.report.revenueByDate.map(r => {
        const date = new Date(r.date);
        if (this.period === 'day') {
          return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        } else if (this.period === 'month') {
          return date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
        } else {
          return date.getFullYear().toString();
        }
      })
    };
  }

  onFilterChange(): void {
    this.loadReport();
  }

  exportExcel(): void {
    if (this.report) {
      this.reportService.exportToExcel(this.report);
    }
  }

  exportPDF(): void {
    if (this.report) {
      this.reportService.exportToPDF(this.report);
    }
  }
}

