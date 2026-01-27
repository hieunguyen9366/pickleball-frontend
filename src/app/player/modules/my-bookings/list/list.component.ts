import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { PaymentService } from '../../../services/payment.service';
import { Booking, BookingStatus, BookingListRequest } from '../../../models/booking.model';
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
  EyeOutline,
  DeleteOutline,
  FilterOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-my-bookings-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardComponent,
    IconDirective
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  private iconService = inject(IconService);
  private cdr = inject(ChangeDetectorRef);

  allBookings: Booking[] = []; // Lưu tất cả bookings
  filteredBookings: Booking[] = []; // Bookings sau khi filter
  isLoading = false;
  error = '';

  // Filters
  selectedStatus: BookingStatus | 'all' = 'all';

  // Expose BookingStatus to template
  BookingStatus = BookingStatus;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  constructor(
    private bookingService: BookingService,
    private paymentService: PaymentService,
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
      EyeOutline,
      DeleteOutline,
      FilterOutline
    );
  }

  ngOnInit(): void {
    // Check for filter from query params
    const status = this.route.snapshot.queryParams['status'];
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      this.selectedStatus = status as BookingStatus;
    }

    // Load bookings immediately like landing page
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.error = '';

    // Load tất cả bookings của user (không filter ở backend)
    const request: BookingListRequest = {
      page: 1,
      pageSize: 1000 // Load tất cả để filter ở frontend
    };

    this.bookingService.getBookings(request).subscribe({
      next: (response) => {
        this.allBookings = [...(response.bookings || [])];
        this.applyFilters(); // Apply filter sau khi load
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.error = 'Không thể tải danh sách đặt sân. Vui lòng thử lại sau.';
        this.allBookings = [];
        this.filteredBookings = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    // Filter theo status
    let filtered = [...this.allBookings];

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(b => b.status === this.selectedStatus);
    }

    // Sort by booking date (mới nhất trước)
    filtered.sort((a, b) => {
      const dateA = new Date(a.bookingDate + 'T' + a.startTime).getTime();
      const dateB = new Date(b.bookingDate + 'T' + b.startTime).getTime();
      return dateB - dateA;
    });

    // Pagination
    this.total = filtered.length;
    this.totalPages = Math.ceil(this.total / this.pageSize);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredBookings = filtered.slice(startIndex, endIndex);
  }

  onStatusChange(status: BookingStatus | 'all'): void {
    this.selectedStatus = status;
    this.currentPage = 1; // Reset về trang đầu khi filter
    this.applyFilters(); // Chỉ filter ở frontend, không gọi lại API
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyFilters(); // Chỉ apply filter, không gọi lại API
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Getter để template sử dụng
  get bookings(): Booking[] {
    return this.filteredBookings;
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
      case BookingStatus.REJECTED:
        return 'close-circle';
      default:
        return 'info-circle';
    }
  }

  getStatusColor(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'success';
      case BookingStatus.PAID:
        return 'info'; // Paid but waiting confirmation
      case BookingStatus.CANCELLED:
      case BookingStatus.REJECTED:
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
        return 'Chờ xác nhận';
      case BookingStatus.CANCELLED:
        return 'Đã hủy';
      case BookingStatus.REJECTED:
        return 'Bị từ chối';
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

  canCancel(booking: Booking): boolean {
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      return false;
    }
    // Check if booking date is in the future
    const bookingDate = new Date(booking.bookingDate + 'T' + booking.startTime);
    return bookingDate > new Date();
  }

  goToDetail(booking: Booking): void {
    this.router.navigate(['/player/my-bookings', booking.bookingId]);
  }

  goToCancel(booking: Booking, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/player/my-bookings', booking.bookingId, 'cancel']);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Expose Math to template
  Math = Math;

  payNow(booking: Booking, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // Redirect to mock payment page
    this.paymentService.createPaymentUrl(booking.bookingId, 'CREDIT_CARD').subscribe({
      next: (url) => {
        window.location.href = url;
      },
      error: (err) => {
        console.error('Failed to create payment URL', err);
        // Show error notification
      }
    });
  }

  getRemainingSeconds(booking: Booking): number {
    if (booking.status !== BookingStatus.PENDING) return 0;

    // CreatedAt is typically string from JSON, parse it
    const created = new Date(booking.createdAt);
    const expireTime = new Date(created.getTime() + 15 * 60000); // 15 minutes
    const now = new Date();

    const diff = Math.floor((expireTime.getTime() - now.getTime()) / 1000);
    return diff > 0 ? diff : 0;
  }

  formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
