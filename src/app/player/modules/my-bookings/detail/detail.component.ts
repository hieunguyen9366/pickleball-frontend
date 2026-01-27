import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { Booking, BookingStatus } from '../../../models/booking.model';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { ApiService } from '../../../../common/api.service';
import {
  CalendarOutline,
  ClockCircleOutline,
  EnvironmentOutline,
  WalletOutline,
  CheckCircleOutline,
  CloseCircleOutline,
  HourglassOutline,
  ArrowLeftOutline,
  DeleteOutline,
  UserOutline,
  PhoneOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-my-bookings-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardComponent,
    IconDirective
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  private iconService = inject(IconService);
  private cdr = inject(ChangeDetectorRef);

  booking: Booking | null = null;
  isLoading = false;
  error = '';
  bookingId: number | null = null;

  constructor(
    private bookingService: BookingService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {
    // Register icons
    this.iconService.addIcon(
      CalendarOutline,
      ClockCircleOutline,
      EnvironmentOutline,
      WalletOutline,
      CheckCircleOutline,
      CloseCircleOutline,
      HourglassOutline,
      ArrowLeftOutline,
      DeleteOutline,
      UserOutline,
      PhoneOutline
    );
  }

  ngOnInit(): void {
    // Khi vào trang chi tiết, luôn scroll lên đầu trang để tránh giữ vị trí cũ
    window.scrollTo({ top: 0, behavior: 'auto' });

    this.route.params.subscribe(params => {
      this.bookingId = +params['id'];
      if (this.bookingId) {
        this.loadBooking();
      }
    });
  }

  loadBooking(): void {
    if (!this.bookingId) return;

    this.isLoading = true;
    this.error = '';

    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (booking) => {
        this.booking = booking;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading booking:', error);
        this.error = this.apiService.extractErrorMessage(error) || 'Không thể tải thông tin đặt sân. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/player/my-bookings']);
  }

  goToCancel(): void {
    if (this.bookingId) {
      this.router.navigate(['/player/my-bookings', this.bookingId, 'cancel']);
    }
  }

  getStatusIcon(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.CONFIRMED:
      case BookingStatus.PAID:
        return 'check-circle';
      case BookingStatus.CANCELLED:
        return 'close-circle';
      case BookingStatus.PENDING:
        return 'hourglass';
      case BookingStatus.COMPLETED:
        return 'check-circle';
      default:
        return 'info-circle';
    }
  }

  getStatusColor(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.CONFIRMED:
      case BookingStatus.PAID:
        return 'success';
      case BookingStatus.CANCELLED:
        return 'danger';
      case BookingStatus.PENDING:
        return 'warning';
      case BookingStatus.COMPLETED:
        return 'primary';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.PENDING:
        return 'Đang chờ';
      case BookingStatus.CONFIRMED:
        return 'Đã xác nhận';
      case BookingStatus.PAID:
        return 'Đã thanh toán';
      case BookingStatus.CANCELLED:
        return 'Đã hủy';
      case BookingStatus.COMPLETED:
        return 'Hoàn thành';
      default:
        return 'Không xác định';
    }
  }

  getFormattedDate(date: string): string {
    if (!date) return 'N/A';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getFormattedTime(time: string): string {
    if (!time) return 'N/A';
    return time;
  }

  getFormattedPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getFormattedDateTime(date: Date | string | undefined): string {
    if (!date) return 'Chưa xác định';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'CREDIT_CARD':
        return 'Thẻ tín dụng';
      case 'DEBIT_CARD':
        return 'Thẻ ghi nợ';
      case 'MOMO':
        return 'Ví MoMo';
      case 'PAYPAL':
        return 'PayPal';
      case 'BANK_TRANSFER':
        return 'Chuyển khoản';
      default:
        return method;
    }
  }

  canCancel(): boolean {
    if (!this.booking) return false;
    if (this.booking.status === BookingStatus.CANCELLED || this.booking.status === BookingStatus.COMPLETED) {
      return false;
    }
    // Check if booking date is in the future
    const bookingDate = new Date(this.booking.bookingDate + 'T' + this.booking.startTime);
    return bookingDate > new Date();
  }
}
