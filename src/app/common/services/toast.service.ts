import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number; // milliseconds, 0 = no auto dismiss
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  private defaultDuration = 5000; // 5 seconds

  constructor(private ngZone: NgZone) {}

  /**
   * Show success toast
   */
  success(message: string, title?: string, duration?: number): void {
    this.show(ToastType.SUCCESS, message, title, duration);
  }

  /**
   * Show error toast
   */
  error(message: string, title?: string, duration?: number): void {
    this.show(ToastType.ERROR, message, title || 'Lỗi', duration || 7000); // Error messages stay longer
  }

  /**
   * Show warning toast
   */
  warning(message: string, title?: string, duration?: number): void {
    this.show(ToastType.WARNING, message, title, duration);
  }

  /**
   * Show info toast
   */
  info(message: string, title?: string, duration?: number): void {
    this.show(ToastType.INFO, message, title, duration);
  }

  /**
   * Show toast
   */
  show(type: ToastType, message: string, title?: string, duration?: number): void {
    // Ensure toast is shown within Angular zone to trigger change detection
    this.ngZone.run(() => {
      const toast: Toast = {
        id: this.generateId(),
        type,
        message,
        title,
        duration: duration !== undefined ? duration : this.defaultDuration
      };

      const currentToasts = this.toastsSubject.value;
      this.toastsSubject.next([...currentToasts, toast]);

      // Auto dismiss if duration > 0
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          this.ngZone.run(() => {
            this.remove(toast.id);
          });
        }, toast.duration);
      }
    });
  }

  /**
   * Remove toast by id
   */
  remove(id: string): void {
    // Ensure removal is within Angular zone
    this.ngZone.run(() => {
      const currentToasts = this.toastsSubject.value;
      this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
    });
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toastsSubject.next([]);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}



