import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { TrophyOutline, CalendarOutline } from '@ant-design/icons-angular/icons';
import { ReportService } from '../../services/report.service';
import { TopCourtsReport, RevenueReportRequest } from '../../models/report.model';
import { ApiService } from '../../../common/api.service';
import { ToastService } from '../../../common/services/toast.service';

@Component({
  selector: 'app-top-courts-report',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, IconDirective],
  templateUrl: './top-courts-report.component.html',
  styleUrls: ['./top-courts-report.component.scss']
})
export class TopCourtsReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  report: TopCourtsReport | null = null;
  isLoading = false;
  error = '';

  period: 'day' | 'month' | 'year' = 'month';
  startDate: string = this.getFirstDayOfMonth();
  endDate: string = this.getTodayDate();

  currentUser = { id: 1, role: 'ADMIN' };

  constructor() {
    this.iconService.addIcon(TrophyOutline, CalendarOutline);
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.loadReport();
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getFirstDayOfMonth(): string {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  }

  loadReport(): void {
    this.isLoading = true;
    this.error = '';

    const request: RevenueReportRequest = {
      startDate: this.startDate,
      endDate: this.endDate,
      period: this.period,
      managerId: this.currentUser.role === 'MANAGER' ? this.currentUser.id : undefined
    };

    this.reportService.getTopCourtsReport(request).subscribe({
      next: (report) => {
        this.report = report;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading top courts report:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải báo cáo top cụm sân. Vui lòng thử lại sau.';
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



