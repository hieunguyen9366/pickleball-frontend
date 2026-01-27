import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { BookingService } from '../../../services/booking.service';
import { Booking } from '../../../models/booking.model';
import { PaymentService } from '../../../services/payment.service';
import { TimeSlotLockService } from '../../../services/time-slot-lock.service';
import { BookingTimerService } from '../../../services/booking-timer.service';
import { ApiService } from '../../../../common/api.service';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  WalletOutline,
  CheckOutline,
  CreditCardOutline,
  BankOutline,
  QrcodeOutline,
  DownCircleOutline,
  ArrowLeftOutline,
  ExclamationCircleOutline,
  ClockCircleOutline
} from '@ant-design/icons-angular/icons';

type PaymentMethodUI = 'CREDIT_CARD' | 'MOMO' | 'CASH';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, IconDirective],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {
  private iconService = inject(IconService);
  private bookingTimerService = inject(BookingTimerService);
  private cdr = inject(ChangeDetectorRef);

  selectedCourt: any;
  bookingDate = '';
  startTime = '';
  endTime = '';
  services: { serviceId: number; quantity: number }[] = [];
  servicesTotal = 0;

  courtPricePerHour = 0;
  courtDurationHours = 0;
  courtTotal = 0;
  grandTotal = 0;

  paymentMethod: PaymentMethodUI = 'CREDIT_CARD';
  isProcessing = false;
  error = '';
  reservedSlotIds: number[] = [];

  // Booking Timer
  bookingTimerState$ = this.bookingTimerService.getTimerState();
  bookingTimerState = this.bookingTimerService.getCurrentState();
  private timerSubscription?: Subscription;

  constructor(
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private lockService: TimeSlotLockService,
    private router: Router,
    private apiService: ApiService
  ) {
    this.iconService.addIcon(
      WalletOutline,
      CheckOutline,
      CreditCardOutline,
      BankOutline,
      QrcodeOutline,
      DownCircleOutline,
      ArrowLeftOutline,
      ExclamationCircleOutline,
      ClockCircleOutline
    );
  }

  ngOnInit(): void {
    const nav = history.state || {};
    this.selectedCourt = nav.selectedCourt;
    this.bookingDate = nav.bookingDate;
    this.startTime = nav.startTime;
    this.endTime = nav.endTime;
    this.services = nav.services || [];
    this.servicesTotal = nav.servicesTotal || 0;
    this.reservedSlotIds = nav.reservedSlotIds || [];

    // Read passed prices
    const passedCourtPrice = nav.courtPrice;
    const passedGrandTotal = nav.grandTotal;

    if (!this.selectedCourt || !this.bookingDate || !this.startTime || !this.endTime) {
      this.router.navigate(['/player/booking/select-court']);
      return;
    }

    // Subscribe to booking timer
    this.timerSubscription = this.bookingTimerState$.subscribe(state => {
      this.bookingTimerState = state;
      this.cdr.detectChanges();
      
      // If timer expired, redirect back
      if (!state.isActive && state.reservedSlotIds.length > 0) {
        this.error = 'Thời gian đặt sân đã hết. Vui lòng bắt đầu lại.';
        setTimeout(() => {
          this.router.navigate(['/player/booking/select-court']);
        }, 2000);
      }
    });

    // Timer tiếp tục chạy từ step 1, không reset
    // Update reserved slots nếu có
    if (this.reservedSlotIds.length > 0) {
      this.bookingTimerService.updateReservedSlots(this.reservedSlotIds);
    }

    this.courtPricePerHour = this.selectedCourt.pricePerHour || 0;
    this.courtDurationHours = this.calculateDurationHours(this.startTime, this.endTime);

    // Use passed total if available (Dynamic Pricing), otherwise fallback
    if (passedCourtPrice !== undefined) {
      this.courtTotal = passedCourtPrice;
    } else {
      this.courtTotal = this.courtPricePerHour * this.courtDurationHours;
    }

    if (passedGrandTotal !== undefined) {
      this.grandTotal = passedGrandTotal;
    } else {
      this.grandTotal = this.courtTotal + this.servicesTotal;
    }
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  calculateDurationHours(start: string, end: string): number {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const diff = Math.max(endMinutes - startMinutes, 0);
    return diff / 60;
  }

  getFormattedPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  confirmPayment(): void {
    // Validate required fields
    if (!this.selectedCourt || !this.bookingDate || !this.startTime || !this.endTime) {
      this.error = 'Thiếu thông tin đặt sân. Vui lòng quay lại chọn sân và khung giờ.';
      return;
    }

    // Validate time
    if (this.startTime >= this.endTime) {
      this.error = 'Giờ kết thúc phải sau giờ bắt đầu.';
      return;
    }

    this.isProcessing = true;
    this.error = '';

    // Tạo booking trước
    this.bookingService.createBooking({
      courtId: this.selectedCourt.courtId,
      bookingDate: this.bookingDate,
      startTime: this.startTime,
      endTime: this.endTime,
      services: this.services
    }).subscribe({
      next: (booking: Booking) => {
        // Clear booking timer (booking succeeded)
        this.bookingTimerService.clearTimer();
        
        // Release locks after successful booking
        this.releaseLocks();

        // Nếu thanh toán bằng tiền mặt, chuyển thẳng đến confirmation
        if (this.paymentMethod === 'CASH') {
          this.isProcessing = false;
          this.router.navigate(['/player/booking/confirmation', booking.bookingId], {
            state: { booking }
          });
          return;
        }

        // Tạo payment URL cho các phương thức thanh toán online
        this.paymentService.createPaymentUrl(booking.bookingId!, this.paymentMethod).subscribe({
          next: (paymentUrl: string) => {
            // Redirect đến payment gateway
            // Trong môi trường thực tế, sẽ redirect đến Momo/VNPay
            // Hiện tại là mock URL, nên sẽ xử lý callback ngay
            if (paymentUrl.includes('callback')) {
              // Parse callback URL để lấy ref và status
              const url = new URL(paymentUrl);
              const ref = url.searchParams.get('ref') || '';
              const status = url.searchParams.get('status') || 'SUCCESS';
              
              // Xử lý callback
              this.paymentService.processPaymentCallback(ref, status).subscribe({
                next: () => {
                  // Locks already released after booking creation
                  this.isProcessing = false;
                  this.router.navigate(['/player/booking/confirmation', booking.bookingId], {
                    state: { booking }
                  });
                },
                error: (err: HttpErrorResponse) => {
                  console.error('Payment callback error:', err);
                  this.error = this.apiService.extractErrorMessage(err) || 'Thanh toán thất bại.';
                  this.isProcessing = false;
                }
              });
            } else {
              // Nếu là URL thực tế, redirect đến payment gateway
              window.location.href = paymentUrl;
            }
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error creating payment URL:', err);
            this.error = this.apiService.extractErrorMessage(err) || 'Không thể tạo link thanh toán.';
            this.isProcessing = false;
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error creating booking:', error);
        const errorMessage = this.apiService.extractErrorMessage(error) || 
                           'Không thể tạo đặt sân. Vui lòng thử lại.';
        this.error = errorMessage;
        this.isProcessing = false;
      }
    });
  }

  /**
   * Release all reserved locks
   */
  private releaseLocks(): void {
    if (this.reservedSlotIds.length === 0) return;

    this.lockService.releaseSlots([...this.reservedSlotIds]).subscribe({
      next: () => {
        console.log('Released all locks after booking');
        this.reservedSlotIds = [];
      },
      error: (error) => {
        console.error('Error releasing locks:', error);
        // Don't show error to user, just log
      }
    });
  }

  getBookingTimerText(): string {
    return this.bookingTimerService.formatTime(this.bookingTimerState.remainingSeconds);
  }

  goBack(): void {
    this.router.navigate(['/player/booking/select-services'], {
      state: {
        selectedCourt: this.selectedCourt,
        bookingDate: this.bookingDate,
        startTime: this.startTime,
        endTime: this.endTime,
        reservedSlotIds: this.reservedSlotIds
      }
    });
  }
}

