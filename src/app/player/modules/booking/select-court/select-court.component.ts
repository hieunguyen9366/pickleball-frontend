import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { CourtService } from '../../../services/court.service';
import { TimeSlotLockService } from '../../../services/time-slot-lock.service';
import { BookingTimerService } from '../../../services/booking-timer.service';
import { AuthService } from '../../../services/auth.service';
import { Court, CourtSearchRequest, TimeSlot } from '../../../models/court.model';
import { ApiService } from '../../../../common/api.service';
import { Subscription, interval } from 'rxjs';
import {
  SearchOutline,
  CalendarOutline,
  ClockCircleOutline,
  EnvironmentOutline,
  CheckCircleFill,
  UserOutline,
  CheckOutline,
  ArrowRightOutline,
  WarningOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-select-court',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardComponent,
    IconDirective
  ],
  templateUrl: './select-court.component.html',
  styleUrls: ['./select-court.component.scss']
})
export class SelectCourtComponent implements OnInit, OnDestroy {
  private iconService = inject(IconService);
  private router = inject(Router);
  private courtService = inject(CourtService);
  private lockService = inject(TimeSlotLockService);
  private bookingTimerService = inject(BookingTimerService);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  // Booking Timer
  bookingTimerState$ = this.bookingTimerService.getTimerState();
  bookingTimerState = this.bookingTimerService.getCurrentState();

  // Current user
  currentUserId: number | null = null;

  // Input Data
  selectedCourt: Court | null = null;

  // Selection Data
  selectedDate: string;
  selectedSlots: string[] = []; // Array of start times e.g. "05:00", "05:30"

  // UI Data
  timeSlots: {
    time: string;
    endTime: string;
    available: boolean;
    selected: boolean;
    price?: number;
    slotId?: number;
    locked?: boolean;
    lockedByUserId?: number;
    isLockedByMe?: boolean;
  }[] = [];
  isLoading = false;
  error = '';

  // Lock Management
  private reservedSlotIds: number[] = [];
  isReserving = false;

  constructor() {
    this.iconService.addIcon(
      SearchOutline,
      CalendarOutline,
      ClockCircleOutline,
      EnvironmentOutline,
      CheckCircleFill,
      UserOutline,
      CheckOutline,
      ArrowRightOutline,
      WarningOutline
    );
    this.selectedDate = this.getTodayDate();
  }

  ngOnInit(): void {
    const nav = history.state || {};
    console.log('SelectCourt Init State:', nav);

    // Get current user ID
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.userId || null;

    // Subscribe to booking timer
    this.bookingTimerState$.subscribe(state => {
      this.bookingTimerState = state;
      this.cdr.detectChanges();

      // If timer expired, show error and reload slots
      if (!state.isActive && state.reservedSlotIds.length > 0) {
        this.error = 'Thời gian đặt sân đã hết. Các khung giờ đã được giải phóng. Vui lòng chọn lại.';
        this.selectedSlots = [];
        this.timeSlots.forEach(slot => {
          slot.selected = false;
          slot.locked = false;
        });
        this.generateTimeSlots();
      }
    });

    // Check for query params if state is missing
    const courtId = this.route.snapshot.queryParamMap.get('courtId');
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    const startTimeParam = this.route.snapshot.queryParamMap.get('startTime');
    const endTimeParam = this.route.snapshot.queryParamMap.get('endTime');

    if (nav.selectedCourt) {
      this.setupBooking(nav.selectedCourt, nav.bookingDate, nav.startTime, nav.endTime, nav.reservedSlotIds);
    } else if (courtId) {
      // Load court from ID
      this.isLoading = true;
      this.courtService.getCourtById(+courtId).subscribe({
        next: (courtDetail) => {
          // Map to Court model (similar to DetailComponent) - simplified mapping
          // Note: Ideally extraction of mapping logic to a service/helper
          const detail = courtDetail as any;
          const court: Court = {
            courtId: courtDetail.courtId,
            courtName: courtDetail.courtName,
            courtGroupId: courtDetail.courtGroupId,
            courtGroupName: detail.courtGroupName || '',
            location: detail.address || '',
            district: detail.district || '',
            city: detail.city || '',
            pricePerHour: typeof detail.basePricePerHour === 'number'
              ? detail.basePricePerHour
              : (detail.basePricePerHour?.toNumber?.() || courtDetail.pricePerHour || 0),
            status: courtDetail.status,
            images: [], // Not critical for this view
            description: detail.description || '',
            amenities: [],
            phone: '',
            rating: detail.averageRating || 0,
            reviewCount: 0
          };

          this.setupBooking(court, dateParam, startTimeParam, endTimeParam);
        },
        error: (err) => {
          console.error('Error loading court:', err);
          this.error = 'Không thể tải thông tin sân. Vui lòng thử lại.';
          this.isLoading = false;
        }
      });
    } else {
      console.warn('No selectedCourt in state or query params, redirecting...');
      this.router.navigate(['/player/court-search']);
    }
  }

  setupBooking(court: Court, date?: string | null, startTime?: string | null, endTime?: string | null, reservedSlotIds?: number[]): void {
    this.selectedCourt = court;

    // Auto-prefill date
    if (date) {
      this.selectedDate = date;
    }

    // Check/Start Timer
    const currentState = this.bookingTimerService.getCurrentState();

    if (!currentState.isActive) {
      this.bookingTimerService.stopTimer();
      this.bookingTimerService.startTimer([]);
    } else {
      if (reservedSlotIds && reservedSlotIds.length > 0) {
        this.reservedSlotIds = [...reservedSlotIds];
        this.bookingTimerService.updateReservedSlots([...this.reservedSlotIds]);
      } else if (currentState.reservedSlotIds.length > 0) {
        this.reservedSlotIds = [...currentState.reservedSlotIds];
      }
    }

    // Load slots
    this.generateTimeSlots(startTime || undefined, endTime || undefined);
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    // KHÔNG release locks khi component destroy
    // Locks sẽ được release bởi:
    // 1. Booking timer hết hạn (10 phút)
    // 2. Booking thành công
    // 3. Scheduler tự động cleanup
    // 4. User tự deselect slot
    // 5. User đổi ngày
  }

  onDateChange(event: any): void {
    this.selectedDate = event.target.value;
    this.selectedSlots = []; // Reset selection on date change
    this.releaseAllLocks(); // Release locks when date changes
    this.generateTimeSlots();
  }

  generateTimeSlots(preSelectStart?: string, preSelectEnd?: string): void {
    if (!this.selectedCourt) return;
    this.isLoading = true;
    this.error = '';
    console.log('Generating slots for:', this.selectedCourt.courtId, this.selectedDate);

    this.courtService.getAvailableTimeSlots(this.selectedCourt.courtId, this.selectedDate).subscribe({
      next: (slots) => {
        console.log('Slots loaded:', slots);
        // Filter out slots with invalid time data and map to display format
        // Backend returns TimeSlotDTO with 'time' field, but frontend model uses 'startTime'
        this.timeSlots = slots
          .filter(s => {
            // Handle both backend format (time) and frontend format (startTime)
            const timeValue = (s as any).time || s.startTime;
            return timeValue && s.endTime;
          })
          .map(s => {
            // Backend returns 'time' field, frontend model has 'startTime'
            const timeValue = (s as any).time || s.startTime || '';
            const availableValue = (s as any).available !== undefined ? (s as any).available : s.isAvailable;
            const isLocked = s.isLocked || (s as any).isLocked || false;
            const lockedByUserId = s.lockedByUserId || (s as any).lockedByUserId;

            // Slot không available nếu:
            // 1. Không available (đã được đặt)
            // 2. Bị lock bởi user khác
            const isLockedByOtherUser = isLocked && lockedByUserId && lockedByUserId !== this.currentUserId;
            const finalAvailable = availableValue && !isLockedByOtherUser;

            return {
              time: timeValue,
              endTime: s.endTime || '',
              available: finalAvailable,
              price: s.price,
              selected: false,
              slotId: s.slotId || (s as any).slotId,
              locked: isLocked,
              lockedByUserId: lockedByUserId,
              isLockedByMe: isLocked && lockedByUserId === this.currentUserId
            };
          });

        // Handle Pre-selection Logic
        if (preSelectStart && preSelectEnd) {
          const sH = parseInt(preSelectStart.split(':')[0], 10);
          const eH = parseInt(preSelectEnd.split(':')[0], 10);

          this.timeSlots.forEach(slot => {
            // Add null check before split
            if (slot.time && slot.time.includes(':')) {
              const h = parseInt(slot.time.split(':')[0], 10);
              if (!isNaN(h) && h >= sH && h < eH && slot.available) {
                slot.selected = true;
                if (!this.selectedSlots.includes(slot.time)) {
                  this.selectedSlots.push(slot.time);
                }
              }
            }
          });
          this.selectedSlots.sort();
        }

        // Restore selected slots từ reservedSlotIds (nếu user quay lại)
        if (this.reservedSlotIds.length > 0) {
          this.timeSlots.forEach(slot => {
            if (slot.slotId && this.reservedSlotIds.includes(slot.slotId)) {
              // Slot đã được reserve, mark as selected và locked by me
              slot.selected = true;
              slot.locked = true;
              slot.isLockedByMe = true;
              slot.lockedByUserId = this.currentUserId || undefined;
              if (!this.selectedSlots.includes(slot.time)) {
                this.selectedSlots.push(slot.time);
              }
            }
          });
          this.selectedSlots.sort();
        }

        this.isLoading = false;
        this.cdr.detectChanges(); // Force ID check
      },
      error: (err) => {
        console.error('Error loading slots:', err);
        this.error = 'Không thể tải lịch sân. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSlot(slot: any): void {
    if (!slot.available) return;

    slot.selected = !slot.selected;

    if (slot.selected) {
      this.selectedSlots.push(slot.time);
      // Reserve slot when selected (only if slotId is available)
      if (slot.slotId) {
        this.reserveSlot(slot);
      } else {
        // If no slotId, just allow selection without reserve
        console.warn('Slot has no slotId, cannot reserve:', slot);
      }
    } else {
      this.selectedSlots = this.selectedSlots.filter(t => t !== slot.time);
      // Release lock when deselected
      if (slot.slotId) {
        this.releaseSlot(slot.slotId);
      }
    }

    this.selectedSlots.sort();
  }

  /**
   * Reserve a single slot
   */
  private reserveSlot(slot: any): void {
    if (!slot.slotId) return;

    this.isReserving = true;
    this.lockService.reserveSlot(slot.slotId, 5).subscribe({
      next: (response) => {
        slot.locked = true;
        slot.isLockedByMe = true;
        slot.lockedByUserId = this.currentUserId || undefined;
        this.reservedSlotIds.push(slot.slotId);

        // Update booking timer with all reserved slots (timer đã start từ khi vào step 1)
        this.bookingTimerService.updateReservedSlots([...this.reservedSlotIds]);

        this.isReserving = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error reserving slot:', error);
        const errorMsg = this.apiService.extractErrorMessage(error);
        this.error = errorMsg || 'Không thể giữ khung giờ này. Vui lòng thử lại.';
        slot.selected = false;
        this.selectedSlots = this.selectedSlots.filter(t => t !== slot.time);
        this.isReserving = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Release a single slot lock
   */
  private releaseSlot(slotId: number): void {
    this.lockService.releaseSlot(slotId).subscribe({
      next: () => {
        this.reservedSlotIds = this.reservedSlotIds.filter(id => id !== slotId);
        const slot = this.timeSlots.find(s => s.slotId === slotId);
        if (slot) {
          slot.locked = false;
          slot.isLockedByMe = false;
          slot.lockedByUserId = undefined;
        }

        // Update booking timer
        this.bookingTimerService.updateReservedSlots([...this.reservedSlotIds]);

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error releasing slot:', error);
        // Don't show error to user, just log it
      }
    });
  }

  /**
   * Release all locks
   */
  private releaseAllLocks(): void {
    if (this.reservedSlotIds.length === 0) return;

    this.lockService.releaseSlots([...this.reservedSlotIds]).subscribe({
      next: () => {
        this.reservedSlotIds.forEach(slotId => {
          const slot = this.timeSlots.find(s => s.slotId === slotId);
          if (slot) {
            slot.locked = false;
            slot.isLockedByMe = false;
            slot.lockedByUserId = undefined;
          }
        });
        this.reservedSlotIds = [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error releasing all locks:', error);
        // Clear anyway
        this.reservedSlotIds = [];
      }
    });
  }

  isSelected(time: string): boolean {
    return this.selectedSlots.includes(time);
  }

  getStartTime(): string {
    if (this.selectedSlots.length === 0) return '';
    return this.selectedSlots[0];
  }

  getEndTime(): string {
    if (this.selectedSlots.length === 0) return '';
    const lastSlot = this.selectedSlots[this.selectedSlots.length - 1];
    const [h, m] = lastSlot.split(':').map(Number);
    return `${(h + 1).toString().padStart(2, '0')}:00`;
  }

  getDuration(): number {
    return this.selectedSlots.length;
  }

  getTotalPrice(): number {
    // Sum price of selected slots
    // Must look up price from timeSlots because it can vary
    if (this.selectedSlots.length === 0) return 0;

    return this.selectedSlots.reduce((total, time) => {
      const slot = this.timeSlots.find(s => s.time === time);
      return total + (slot?.price || this.selectedCourt?.pricePerHour || 0);
    }, 0);
  }

  continueBooking(): void {
    if (!this.selectedCourt || this.selectedSlots.length === 0) {
      this.error = 'Vui lòng chọn ít nhất một khung giờ.';
      return;
    }

    // Validate: Tất cả slots đã chọn phải còn available
    const unavailableSlots = this.selectedSlots.filter(time => {
      const slot = this.timeSlots.find(s => s.time === time);
      return !slot || !slot.available;
    });

    if (unavailableSlots.length > 0) {
      this.error = 'Một số khung giờ đã được đặt. Vui lòng chọn lại.';
      // Reload slots để cập nhật trạng thái
      this.generateTimeSlots();
      return;
    }

    // Validate: Slots phải liên tiếp
    const sortedSlots = [...this.selectedSlots].sort();
    const isConsecutive = sortedSlots.every((time, index) => {
      if (index === 0) return true;
      const prevTime = sortedSlots[index - 1];
      const [prevH, prevM] = prevTime.split(':').map(Number);
      const [currH, currM] = time.split(':').map(Number);
      const prevMinutes = prevH * 60 + prevM;
      const currMinutes = currH * 60 + currM;
      // Check if current slot is exactly 1 hour after previous (assuming 1-hour slots)
      return currMinutes === prevMinutes + 60;
    });

    if (!isConsecutive) {
      this.error = 'Vui lòng chọn các khung giờ liên tiếp.';
      return;
    }

    this.error = ''; // Clear error if validation passes

    // Timer tiếp tục chạy, không reset
    // Pass reserved slot IDs to next step so they can be released after booking
    this.router.navigate(['/player/booking/select-services'], {
      state: {
        selectedCourt: this.selectedCourt,
        bookingDate: this.selectedDate,
        startTime: this.getStartTime(),
        endTime: this.getEndTime(),
        title: this.selectedCourt.courtName,
        totalCourtPrice: this.getTotalPrice(), // Pass calculated price from selected slots
        selectedSlots: this.selectedSlots, // Pass selected slots for reference
        reservedSlotIds: [...this.reservedSlotIds] // Pass reserved slot IDs
      }
    });
  }

  getBookingTimerText(): string {
    return this.bookingTimerService.formatTime(this.bookingTimerState.remainingSeconds);
  }
}

