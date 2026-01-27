import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { 
  ArrowLeftOutline, 
  EditOutline, 
  DeleteOutline, 
  CheckCircleOutline,
  CloseCircleOutline,
  CalendarOutline,
  ClockCircleOutline,
  EnvironmentOutline,
  DollarOutline
} from '@ant-design/icons-angular/icons';
import { BookingService } from '../../../player/services/booking.service';
import { Booking, BookingStatus } from '../../../player/models/booking.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { ApiService } from '../../../common/api.service';
import { ToastService } from '../../../common/services/toast.service';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, IconDirective],
  templateUrl: './booking-detail.component.html',
  styleUrls: ['./booking-detail.component.scss']
})
export class BookingDetailComponent implements OnInit {
  private bookingService = inject(BookingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private modalService = inject(NgbModal);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  booking: Booking | null = null;
  isLoading = false;
  error = '';
  bookingId!: number;

  BookingStatus = BookingStatus;

  constructor() {
    this.iconService.addIcon(
      ArrowLeftOutline,
      EditOutline,
      DeleteOutline,
      CheckCircleOutline,
      CloseCircleOutline,
      CalendarOutline,
      ClockCircleOutline,
      EnvironmentOutline,
      DollarOutline
    );
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bookingId = +id;
      this.loadBooking();
    } else {
      this.error = 'Không tìm thấy ID đặt sân.';
    }
  }

  loadBooking(): void {
    this.isLoading = true;
    this.error = '';

    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (booking) => {
        this.booking = booking;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading booking detail:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải thông tin đặt sân. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  editBooking(): void {
    if (!this.booking) return;

    const modalRef = this.modalService.open(BookingModalComponent, { 
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.booking = this.booking;
    modalRef.result.then((result) => {
      if (result === 'saved' || result === 'cancelled') {
        setTimeout(() => {
          this.loadBooking();
        }, 100);
      }
    }).catch(() => {
      // Modal dismissed, do nothing
    });
  }

  cancelBooking(): void {
    if (!this.booking) return;

    if (confirm('Bạn có chắc chắn muốn hủy đặt sân này không?')) {
      this.isLoading = true;
      this.bookingService.cancelBooking({
        bookingId: this.booking.bookingId,
        reason: 'Hủy bởi quản trị viên'
      }).subscribe({
        next: (response) => {
          this.toastService.success(response.message || 'Hủy đặt sân thành công!', 'Thành công');
          this.loadBooking();
        },
        error: (err) => {
          console.error('Error cancelling booking:', err);
          const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể hủy đặt sân. Vui lòng thử lại sau.';
          this.toastService.error(errorMsg, 'Lỗi hủy đặt sân');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  updateStatus(status: BookingStatus): void {
    if (!this.booking) return;

    const statusLabel = this.getStatusLabel(status);
    if (confirm(`Bạn có chắc chắn muốn cập nhật trạng thái thành ${statusLabel} không?`)) {
      this.isLoading = true;
      this.bookingService.updateBookingStatus(this.booking.bookingId, status).subscribe({
        next: () => {
          this.loadBooking();
        },
        error: (err) => {
          console.error('Error updating status:', err);
          const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể cập nhật trạng thái. Vui lòng thử lại sau.';
          this.toastService.error(errorMsg, 'Lỗi cập nhật');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  getStatusClass(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'badge bg-light-success text-success';
      case BookingStatus.PAID: return 'badge bg-light-primary text-primary';
      case BookingStatus.PENDING: return 'badge bg-light-warning text-warning';
      case BookingStatus.CANCELLED: return 'badge bg-light-danger text-danger';
      case BookingStatus.COMPLETED: return 'badge bg-light-info text-info';
      default: return 'badge bg-light-secondary text-secondary';
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

  goBack(): void {
    this.router.navigate(['/admin/booking-management/list']);
  }

  getTotalServicesPrice(): number {
    if (!this.booking || !this.booking.services) return 0;
    return this.booking.services.reduce((sum, s) => sum + s.totalPrice, 0);
  }

  getCourtPrice(): number {
    if (!this.booking) return 0;
    return this.booking.totalPrice - this.getTotalServicesPrice();
  }
}

