import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';
import { ApiService } from '../../../../common/api.service';
import {
  CheckCircleOutline,
  CalendarOutline,
  ClockCircleOutline,
  EnvironmentOutline,
  WalletOutline,
  CheckCircleFill
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, IconDirective],
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationComponent implements OnInit {
  private iconService = inject(IconService);

  booking: Booking | null = null;
  isLoading = false;
  error = '';

  constructor(
    private bookingService: BookingService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {
    this.iconService.addIcon(
      CheckCircleOutline,
      CalendarOutline,
      ClockCircleOutline,
      EnvironmentOutline,
      WalletOutline,
      CheckCircleFill
    );
  }

  ngOnInit(): void {
    // Scroll lên đầu trang khi vào màn xác nhận
    window.scrollTo({ top: 0, behavior: 'auto' });

    const nav = history.state || {};
    if (nav.booking) {
      this.booking = nav.booking;
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadBooking(id);
    } else {
      this.error = 'Không tìm thấy mã đặt sân.';
    }
  }

  loadBooking(id: number): void {
    this.isLoading = true;
    this.error = '';
    this.bookingService.getBookingById(id).subscribe({
      next: (booking) => {
        this.booking = booking;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading booking:', error);
        this.error = this.apiService.extractErrorMessage(error) || 'Không thể tải thông tin đặt sân. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    });
  }

  getFormattedPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  goToMyBookings(): void {
    this.router.navigate(['/player/my-bookings']);
  }

  goToHome(): void {
    this.router.navigate(['/player/landing']);
  }
}

