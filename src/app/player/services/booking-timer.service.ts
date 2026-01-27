import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { TimeSlotLockService } from './time-slot-lock.service';

export interface BookingTimerState {
  isActive: boolean;
  remainingSeconds: number;
  reservedSlotIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class BookingTimerService {
  private readonly BOOKING_TIMEOUT_SECONDS = 600; // 10 minutes
  private timerState$ = new BehaviorSubject<BookingTimerState>({
    isActive: false,
    remainingSeconds: 0,
    reservedSlotIds: []
  });
  
  private countdownInterval: Subscription | null = null;
  private reservedSlotIds: number[] = [];

  constructor(private lockService: TimeSlotLockService) {}

  /**
   * Start booking timer with reserved slots
   * Nếu timer đã chạy, chỉ update slotIds, không reset thời gian
   */
  startTimer(slotIds: number[]): void {
    const currentState = this.timerState$.value;
    
    // Nếu timer chưa chạy, start mới
    if (!currentState.isActive) {
      this.reservedSlotIds = [...slotIds];
      this.timerState$.next({
        isActive: true,
        remainingSeconds: this.BOOKING_TIMEOUT_SECONDS,
        reservedSlotIds: this.reservedSlotIds
      });
      this.startCountdown();
    } else {
      // Timer đã chạy, chỉ update slotIds
      this.reservedSlotIds = [...slotIds];
      this.timerState$.next({
        ...currentState,
        reservedSlotIds: this.reservedSlotIds
      });
    }
  }

  /**
   * Update reserved slots without resetting timer
   */
  updateReservedSlots(slotIds: number[]): void {
    const currentState = this.timerState$.value;
    if (currentState.isActive) {
      this.reservedSlotIds = [...slotIds];
      this.timerState$.next({
        ...currentState,
        reservedSlotIds: this.reservedSlotIds
      });
    }
  }

  /**
   * Reset timer (extend time) - KHÔNG DÙNG NỮA, timer chạy liên tục
   */
  resetTimer(): void {
    // Không reset timer nữa, timer chạy liên tục qua các steps
    // Chỉ update slotIds nếu cần
    const currentState = this.timerState$.value;
    if (currentState.isActive) {
      this.timerState$.next({
        ...currentState,
        reservedSlotIds: this.reservedSlotIds
      });
    }
  }

  /**
   * Stop timer and release all locks
   */
  stopTimer(): void {
    this.releaseAllLocks();
    this.timerState$.next({
      isActive: false,
      remainingSeconds: 0,
      reservedSlotIds: []
    });
    this.reservedSlotIds = [];
    if (this.countdownInterval) {
      this.countdownInterval.unsubscribe();
      this.countdownInterval = null;
    }
  }

  /**
   * Clear timer without releasing locks (when booking succeeds)
   */
  clearTimer(): void {
    this.timerState$.next({
      isActive: false,
      remainingSeconds: 0,
      reservedSlotIds: []
    });
    this.reservedSlotIds = [];
    if (this.countdownInterval) {
      this.countdownInterval.unsubscribe();
      this.countdownInterval = null;
    }
  }

  /**
   * Get timer state as observable
   */
  getTimerState(): Observable<BookingTimerState> {
    return this.timerState$.asObservable();
  }

  /**
   * Get current timer state
   */
  getCurrentState(): BookingTimerState {
    return this.timerState$.value;
  }

  /**
   * Start countdown
   */
  private startCountdown(): void {
    if (this.countdownInterval) {
      this.countdownInterval.unsubscribe();
    }

    this.countdownInterval = interval(1000).subscribe(() => {
      const currentState = this.timerState$.value;
      
      if (currentState.isActive && currentState.remainingSeconds > 0) {
        const newRemainingSeconds = currentState.remainingSeconds - 1;
        
        this.timerState$.next({
          ...currentState,
          remainingSeconds: newRemainingSeconds
        });

        // If time expired, release locks
        if (newRemainingSeconds === 0) {
          this.releaseAllLocks();
          this.timerState$.next({
            isActive: false,
            remainingSeconds: 0,
            reservedSlotIds: []
          });
        }
      }
    });
  }

  /**
   * Release all reserved locks
   */
  private releaseAllLocks(): void {
    if (this.reservedSlotIds.length === 0) return;

    this.lockService.releaseSlots([...this.reservedSlotIds]).subscribe({
      next: () => {
        console.log('Released all locks due to timeout');
      },
      error: (error) => {
        console.error('Error releasing locks:', error);
      }
    });
    
    this.reservedSlotIds = [];
  }

  /**
   * Format countdown time
   */
  formatTime(seconds: number): string {
    if (seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

