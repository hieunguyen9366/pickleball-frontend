import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../theme/shared/components/card/card.component';
import { SalesReportChartComponent } from '../../theme/shared/apexchart/sales-report-chart/sales-report-chart.component';
import { MonthlyBarChartComponent } from '../../theme/shared/apexchart/monthly-bar-chart/monthly-bar-chart.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { ReportService } from '../services/report.service';
import { DashboardStats } from '../models/report.model';
import { BookingService } from '../../player/services/booking.service';
import {
    RiseOutline,
    FallOutline,
    TeamOutline,
    ShopOutline,
    CalendarOutline,
    DollarOutline,
    MoneyCollectOutline,
    TrophyOutline
} from '@ant-design/icons-angular/icons';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        CardComponent,
        SalesReportChartComponent,
        MonthlyBarChartComponent,
        IconDirective
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    private iconService = inject(IconService);
    private reportService = inject(ReportService);
    private bookingService = inject(BookingService);

    statsData: DashboardStats | null = null;
    recentBookings: any[] = [];
    currentRevenueData: any[] = [];
    currentTopCourtsData: any[] = [];

    // Default stats before loading
    stats = [
        {
            title: 'Tổng doanh thu',
            amount: '0 ₫',
            icon: 'dollar',
            color: 'text-primary',
            bg: 'bg-light-primary',
            trend: 'Tổng cộng',
            trendColor: 'text-primary'
        },
        {
            title: 'Lượt đặt (Tháng này)',
            amount: '0',
            icon: 'calendar',
            color: 'text-success',
            bg: 'bg-light-success',
            trend: 'Tháng này',
            trendColor: 'text-success'
        },
        {
            title: 'Tổng Thành viên',
            amount: '0',
            icon: 'team',
            color: 'text-warning',
            bg: 'bg-light-warning',
            trend: 'Tất cả',
            trendColor: 'text-warning'
        },
        {
            title: 'Sân hoạt động',
            amount: '0',
            icon: 'shop',
            color: 'text-danger',
            bg: 'bg-light-danger',
            trend: 'Active',
            trendColor: 'text-danger'
        }
    ];

    constructor() {
        this.iconService.addIcon(
            RiseOutline,
            FallOutline,
            TeamOutline,
            ShopOutline,
            CalendarOutline,
            DollarOutline,
            MoneyCollectOutline,
            TrophyOutline
        );
    }

    ngOnInit(): void {
        this.loadDashboardStats();
        this.loadRecentBookings();
        this.loadRevenueChart();
        this.loadTopCourtsChart();
    }

    // Helper
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadDashboardStats(): void {
        this.reportService.getDashboardStats().subscribe({
            next: (data) => {
                this.statsData = data;
                this.updateStatsCards(data);
            },
            error: (err) => console.error('Failed to load dashboard stats', err)
        });
    }

    loadRecentBookings(): void {
        this.bookingService.getBookings({ pageSize: 5 }).subscribe({
            next: (res) => {
                this.recentBookings = (res.bookings || []).map(b => ({
                    id: '#' + b.bookingId,
                    user: b.userName || 'Unknown',
                    court: b.courtName || 'Unknown',
                    time: b.startTime + ' - ' + b.endTime,
                    date: b.bookingDate,
                    status: b.status,
                    amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.totalPrice)
                }));
            },
            error: (err) => console.error('Failed to load recent bookings', err)
        });
    }

    loadRevenueChart(): void {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6); // Last 7 days

        this.reportService.getRevenueReport({
            startDate: this.formatDate(start),
            endDate: this.formatDate(end),
            period: 'day'
        }).subscribe({
            next: (res) => {
                this.currentRevenueData = res.revenueByDate || [];
            },
            error: (err) => console.error('Revenue chart load failed', err)
        });
    }

    loadTopCourtsChart(): void {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30); // Last 30 days

        this.reportService.getTopCourtsReport({
            startDate: this.formatDate(start),
            endDate: this.formatDate(end),
            limit: 5
        }).subscribe({
            next: (res) => {
                this.currentTopCourtsData = (res as any) || [];
            },
            error: (err) => console.error('Top courts load failed', err)
        });
    }

    updateStatsCards(data: DashboardStats): void {
        this.stats = [
            {
                title: 'Tổng doanh thu',
                amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.totalRevenue || 0),
                icon: 'dollar',
                color: 'text-primary',
                bg: 'bg-light-primary',
                trend: 'Tổng cộng',
                trendColor: 'text-primary'
            },
            {
                title: 'Lượt đặt (Tháng này)',
                amount: (data.monthBookings || 0).toString(),
                icon: 'calendar',
                color: 'text-success',
                bg: 'bg-light-success',
                trend: 'Tháng ' + (new Date().getMonth() + 1),
                trendColor: 'text-success'
            },
            {
                title: 'Thành viên',
                amount: (data.totalUsers || 0).toString(),
                icon: 'team',
                color: 'text-warning',
                bg: 'bg-light-warning',
                trend: 'Tổng số',
                trendColor: 'text-warning'
            },
            {
                title: 'Sân hoạt động',
                amount: (data.activeCourts || 0) + '/' + (data.totalCourts || 0),
                icon: 'shop',
                color: 'text-danger',
                bg: 'bg-light-danger',
                trend: 'Active',
                trendColor: 'text-success'
            }
        ];
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'CONFIRMED': return 'badge bg-light-success text-success';
            case 'PAID': return 'badge bg-light-info text-info';
            case 'PENDING': return 'badge bg-light-warning text-warning';
            case 'CANCELLED':
            case 'REJECTED': return 'badge bg-light-danger text-danger';
            case 'COMPLETED': return 'badge bg-light-primary text-primary';
            default: return 'badge bg-light-secondary text-secondary';
        }
    }
}
