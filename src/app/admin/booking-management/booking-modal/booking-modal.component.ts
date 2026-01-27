import { Component, Input, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Booking, BookingStatus } from '../../../player/models/booking.model';
import { BookingService } from '../../../player/services/booking.service';
import { ApiService } from '../../../common/api.service';
import { ToastService } from '../../../common/services/toast.service';

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-modal.component.html',
  styleUrls: ['./booking-modal.component.scss']
})
export class BookingModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private bookingService = inject(BookingService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  @Input() booking?: Booking;

  formData: Partial<Booking> = {
    bookingDate: '',
    startTime: '',
    endTime: '',
    status: BookingStatus.PENDING
  };

  BookingStatus = BookingStatus;
  isLoading = false;
  error = '';

  ngOnInit(): void {
    if (this.booking) {
      this.formData = {
        bookingDate: this.booking.bookingDate,
        startTime: this.booking.startTime,
        endTime: this.booking.endTime,
        status: this.booking.status
      };
    }
  }

  save(): void {
    if (!this.booking) return;

    if (!this.formData.status) {
      this.error = 'Vui lòng chọn trạng thái.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Update booking
    this.bookingService.updateBookingStatus(this.booking.bookingId, this.formData.status as BookingStatus).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.toastService.success('Cập nhật trạng thái đặt sân thành công!', 'Thành công');
        setTimeout(() => {
          this.activeModal.close('saved');
        }, 300);
      },
      error: (err) => {
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể cập nhật đặt sân. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi cập nhật');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}

