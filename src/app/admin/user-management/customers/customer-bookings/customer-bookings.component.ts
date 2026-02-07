import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { ArrowLeftOutline, EyeOutline } from '@ant-design/icons-angular/icons';
import { BookingService } from 'src/app/player/services/booking.service';
import { UserService } from 'src/app/player/services/user.service';
import { Booking, BookingStatus } from 'src/app/player/models/booking.model';
import { User, UserRole } from 'src/app/player/models/user.model';
import { ApiService } from 'src/app/common/api.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-customer-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, IconDirective],
  templateUrl: './customer-bookings.component.html',
  styleUrls: ['./customer-bookings.component.scss']
})
export class CustomerBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private cd = inject(ChangeDetectorRef);

  customer: User | null = null;
  bookings: Booking[] = [];
  isLoading = false;
  error = '';

  constructor() {
    this.iconService.addIcon(ArrowLeftOutline, EyeOutline);
  }

  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('id');
    if (customerId) {
      this.loadCustomer(+customerId);
      this.loadBookings(+customerId);
    } else {
      this.error = 'Không tìm thấy ID khách hàng.';
    }
  }

  loadCustomer(customerId: number): void {
    this.userService.getUsersByRole(UserRole.CUSTOMER).subscribe({
      next: (customers) => {
        this.customer = customers.find(c => c.userId === customerId) || null;
        if (!this.customer) {
          this.error = 'Không tìm thấy khách hàng.';
        }
        this.cd.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading customer:', err);
        // Sử dụng ApiService.extractErrorMessage() để thống nhất
        this.error = this.apiService.extractErrorMessage(err) ||
          'Không thể tải thông tin khách hàng.';
      }
    });
  }

  loadBookings(customerId: number): void {
    this.isLoading = true;
    this.error = '';

    this.bookingService.getBookings({ userId: customerId, pageSize: 100 }).subscribe({
      next: (response) => {
        this.bookings = response.bookings || [];
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading bookings:', err);
        // Sử dụng ApiService.extractErrorMessage() để thống nhất
        this.error = this.apiService.extractErrorMessage(err) ||
          'Không thể tải lịch sử đặt sân. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    });
  }

  getStatusLabel(status: BookingStatus): string {
    const labels: Record<BookingStatus, string> = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PAID: 'Đã thanh toán',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
      REJECTED: 'Bị từ chối'
    };
    return labels[status] || status;
  }

  getStatusClass(status: BookingStatus): string {
    const classes: Record<BookingStatus, string> = {
      PENDING: 'badge bg-warning',
      CONFIRMED: 'badge bg-info',
      PAID: 'badge bg-success',
      COMPLETED: 'badge bg-primary',
      CANCELLED: 'badge bg-danger',
      REJECTED: 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  goBack(): void {
    this.router.navigate(['/admin/user-management/customers']);
  }

  viewBookingDetail(bookingId: number): void {
    this.router.navigate(['/admin/booking-management', bookingId]);
  }
}

