import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from '../../../services/booking.service';
import { Booking, CancelBookingRequest } from '../../../models/booking.model';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { ApiService } from '../../../../common/api.service';
import {
  ArrowLeftOutline,
  DeleteOutline,
  ExclamationCircleOutline,
  CheckCircleOutline,
  WalletOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-my-bookings-cancel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardComponent,
    IconDirective
  ],
  templateUrl: './cancel.component.html',
  styleUrls: ['./cancel.component.scss']
})
export class CancelComponent implements OnInit {
  private iconService = inject(IconService);

  booking: Booking | null = null;
  isLoading = false;
  isCancelling = false;
  error = '';
  success = false;
  bookingId: number | null = null;
  cancelForm: FormGroup;

  constructor(
    private bookingService: BookingService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    // Register icons
    this.iconService.addIcon(
      ArrowLeftOutline,
      DeleteOutline,
      ExclamationCircleOutline,
      CheckCircleOutline,
      WalletOutline
    );

    this.cancelForm = this.fb.group({
      reason: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
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
      },
      error: (error) => {
        console.error('Error loading booking:', error);
        this.error = 'Không thể tải thông tin đặt sân. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.bookingId || !this.cancelForm.valid) {
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn hủy đặt sân này? Số tiền hoàn lại sẽ được xử lý theo chính sách của hệ thống.')) {
      return;
    }

    this.isCancelling = true;
    this.error = '';

    const request: CancelBookingRequest = {
      bookingId: this.bookingId,
      reason: this.cancelForm.value.reason || undefined
    };

    this.bookingService.cancelBooking(request).subscribe({
      next: (response) => {
        this.success = true;
        this.isCancelling = false;
        
        // Redirect to list after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/player/my-bookings']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error cancelling booking:', error);
        this.error = this.apiService.extractErrorMessage(error) || 'Không thể hủy đặt sân. Vui lòng thử lại sau.';
        this.isCancelling = false;
      }
    });
  }

  goBack(): void {
    if (this.bookingId) {
      this.router.navigate(['/player/my-bookings', this.bookingId]);
    } else {
      this.router.navigate(['/player/my-bookings']);
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
}
