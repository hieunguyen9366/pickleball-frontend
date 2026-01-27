import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { Notification, NotificationType } from '../../../models/notification.model';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { ApiService } from '../../../../common/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import {
  BellOutline,
  CalendarOutline,
  WalletOutline,
  CloseCircleOutline,
  ClockCircleOutline,
  InfoCircleOutline,
  ArrowLeftOutline,
  DeleteOutline,
  CheckCircleOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardComponent,
    IconDirective
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  private iconService = inject(IconService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private apiService = inject(ApiService);

  notification: Notification | null = null;
  isLoading = false;
  error = '';
  notificationId: number | null = null;

  constructor() {
    // Register icons
    this.iconService.addIcon(
      BellOutline,
      CalendarOutline,
      WalletOutline,
      CloseCircleOutline,
      ClockCircleOutline,
      InfoCircleOutline,
      ArrowLeftOutline,
      DeleteOutline,
      CheckCircleOutline
    );
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.notificationId = +id;
        if (isNaN(this.notificationId) || this.notificationId <= 0) {
          this.error = 'ID thông báo không hợp lệ.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
        this.loadNotification();
      } else {
        this.error = 'Không tìm thấy ID thông báo.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadNotification(): void {
    if (!this.notificationId) {
      this.error = 'ID thông báo không hợp lệ.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.notificationService.getNotificationById(this.notificationId).subscribe({
      next: (notification) => {
        // Đảm bảo có notificationId hoặc id
        if (!notification.notificationId && !notification.id) {
          this.error = 'Thông báo không hợp lệ.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        // Map id sang notificationId nếu cần
        if (!notification.notificationId && notification.id) {
          notification.notificationId = notification.id;
        }
        
        this.notification = notification;
        
        // Mark as read if unread (sau khi đã load xong)
        if (!notification.isRead) {
          setTimeout(() => {
            this.markAsRead();
          }, 0);
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading notification:', error);
        this.error = this.apiService.extractErrorMessage(error) || 
                    'Không thể tải thông báo. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  markAsRead(): void {
    const id = this.notificationId || this.notification?.notificationId || this.notification?.id;
    if (!id || !this.notification || this.notification.isRead) return;

    this.notificationService.markAsRead({ notificationId: id }).subscribe({
      next: () => {
        if (this.notification) {
          this.notification.isRead = true;
          this.notification.readAt = new Date();
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error marking as read:', error);
      }
    });
  }

  deleteNotification(): void {
    if (!this.notificationId) return;

    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      return;
    }

    this.notificationService.deleteNotification(this.notificationId).subscribe({
      next: () => {
        this.router.navigate(['/player/notifications']);
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
        alert('Không thể xóa thông báo. Vui lòng thử lại.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/player/notifications']);
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.BOOKING:
        return 'calendar';
      case NotificationType.PAYMENT:
        return 'wallet';
      case NotificationType.CANCELLATION:
        return 'close-circle';
      case NotificationType.REMINDER:
        return 'clock-circle';
      default:
        return 'info-circle';
    }
  }

  getNotificationIconColor(type: NotificationType): string {
    switch (type) {
      case NotificationType.BOOKING:
        return 'primary';
      case NotificationType.PAYMENT:
        return 'success';
      case NotificationType.CANCELLATION:
        return 'danger';
      case NotificationType.REMINDER:
        return 'warning';
      default:
        return 'info';
    }
  }

  getNotificationTypeLabel(type: NotificationType): string {
    switch (type) {
      case NotificationType.BOOKING:
        return 'Đặt sân';
      case NotificationType.PAYMENT:
        return 'Thanh toán';
      case NotificationType.CANCELLATION:
        return 'Hủy đặt sân';
      case NotificationType.REMINDER:
        return 'Nhắc nhở';
      default:
        return 'Thông báo';
    }
  }

  getFormattedDate(date: Date | string | undefined): string {
    if (!date) return 'Chưa xác định';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
