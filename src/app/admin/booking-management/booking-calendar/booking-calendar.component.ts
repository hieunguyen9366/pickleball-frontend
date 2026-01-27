import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { 
  CalendarOutline, 
  LeftOutline, 
  RightOutline,
  EyeOutline
} from '@ant-design/icons-angular/icons';
import { BookingService } from '../../../player/services/booking.service';
import { Booking, BookingStatus } from '../../../player/models/booking.model';
import { ApiService } from '../../../common/api.service';
import { ToastService } from '../../../common/services/toast.service';

interface CalendarDay {
  date: Date;
  dateStr: string; // Format: YYYY-MM-DD
  isToday: boolean;
  isCurrentMonth: boolean;
  bookings: Booking[];
}

interface CalendarWeek {
  days: CalendarDay[];
}

@Component({
  selector: 'app-booking-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, IconDirective],
  templateUrl: './booking-calendar.component.html',
  styleUrls: ['./booking-calendar.component.scss']
})
export class BookingCalendarComponent implements OnInit {
  private bookingService = inject(BookingService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  currentDate: Date = new Date();
  viewMode: 'week' | 'day' = 'week';
  weeks: CalendarWeek[] = [];
  selectedDate?: Date;
  selectedBookings: Booking[] = [];

  isLoading = false;
  error = '';

  // Mock User Context
  currentUser = { id: 1, role: 'ADMIN' };

  BookingStatus = BookingStatus;

  constructor() {
    this.iconService.addIcon(CalendarOutline, LeftOutline, RightOutline, EyeOutline);
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.loadCalendar();
  }

  loadCalendar(): void {
    this.isLoading = true;
    this.error = '';

    // Calculate date range
    const startDate = this.getStartOfWeek(this.currentDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (this.viewMode === 'week' ? 6 : 0));

    // Load bookings
    const request: any = {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      pageSize: 1000
    };

    if (this.currentUser.role === 'MANAGER') {
      request.managerId = this.currentUser.id;
    }

    this.bookingService.getBookings(request).subscribe({
      next: (response) => {
        this.buildCalendar(response.bookings);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải lịch đặt sân. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  buildCalendar(bookings: Booking[]): void {
    this.weeks = [];
    const startDate = this.getStartOfWeek(this.currentDate);
    
    if (this.viewMode === 'week') {
      const week: CalendarWeek = { days: [] };
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = this.formatDate(date);
        const dayBookings = bookings.filter(b => b.bookingDate === dateStr);
        
        week.days.push({
          date,
          dateStr,
          isToday: this.isToday(date),
          isCurrentMonth: true,
          bookings: dayBookings
        });
      }
      this.weeks.push(week);
    } else {
      // Day view - chỉ hiển thị 1 ngày
      const dateStr = this.formatDate(this.currentDate);
      const dayBookings = bookings.filter(b => b.bookingDate === dateStr);
      
      const week: CalendarWeek = { days: [] };
      week.days.push({
        date: new Date(this.currentDate),
        dateStr,
        isToday: this.isToday(this.currentDate),
        isCurrentMonth: true,
        bookings: dayBookings
      });
      this.weeks.push(week);
    }
  }

  getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  previousWeek(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() - (this.viewMode === 'week' ? 7 : 1));
    this.currentDate = newDate;
    this.loadCalendar();
  }

  nextWeek(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + (this.viewMode === 'week' ? 7 : 1));
    this.currentDate = newDate;
    this.loadCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.loadCalendar();
  }

  selectDate(day: CalendarDay): void {
    this.selectedDate = day.date;
    this.selectedBookings = day.bookings;
  }

  viewDetail(bookingId: number): void {
    this.router.navigate(['/admin/booking-management', bookingId]);
  }

  getStatusClass(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'bg-success';
      case BookingStatus.PAID: return 'bg-primary';
      case BookingStatus.PENDING: return 'bg-warning';
      case BookingStatus.CANCELLED: return 'bg-danger';
      case BookingStatus.COMPLETED: return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'Đã xác nhận';
      case BookingStatus.PAID: return 'Đã thanh toán';
      case BookingStatus.PENDING: return 'Chờ xử lý';
      case BookingStatus.CANCELLED: return 'Đã hủy';
      case BookingStatus.COMPLETED: return 'Hoàn thành';
      default: return status;
    }
  }
}

