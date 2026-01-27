import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../services/notification.service';
import { Notification, NotificationType, NotificationListRequest } from '../../../models/notification.model';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
  BellOutline,
  CheckCircleOutline,
  DeleteOutline,
  EyeOutline,
  FilterOutline,
  CalendarOutline,
  CheckOutline,
  CloseCircleOutline,
  WalletOutline,
  ClockCircleOutline,
  ExclamationCircleOutline,
  InfoCircleOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardComponent,
    IconDirective,
    NgbDropdownModule
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  private iconService = inject(IconService);
  private cdr = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  notifications: Notification[] = [];
  isLoading = false;
  error = '';
  
  // Filters
  selectedFilter: 'all' | 'unread' | 'read' = 'all';
  selectedType: NotificationType | 'all' = 'all';
  
  // Expose NotificationType to template
  NotificationType = NotificationType;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;
  unreadCount = 0;

  constructor() {
    // Register icons
    this.iconService.addIcon(
      BellOutline,
      CheckCircleOutline,
      DeleteOutline,
      EyeOutline,
      FilterOutline,
      CalendarOutline,
      CheckOutline,
      CloseCircleOutline,
      WalletOutline,
      ClockCircleOutline,
      ExclamationCircleOutline,
      InfoCircleOutline
    );
  }

  ngOnInit(): void {
    // Check for filter from query params
    const filter = this.route.snapshot.queryParams['filter'];
    if (filter === 'unread' || filter === 'read') {
      this.selectedFilter = filter;
    }
    
    // Load notifications immediately like landing page
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.error = '';

    const request: NotificationListRequest = {
      page: this.currentPage,
      pageSize: this.pageSize,
      isRead: this.selectedFilter === 'all' ? undefined : this.selectedFilter === 'read',
      type: this.selectedType === 'all' ? undefined : this.selectedType
    };

    this.notificationService.getNotifications(request).subscribe({
      next: (response) => {
        this.notifications = [...(response.notifications || [])];
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.unreadCount = response.unreadCount;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.error = 'Không thể tải danh sách thông báo. Vui lòng thử lại sau.';
        this.notifications = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count || 0;
      },
      error: () => {
        this.unreadCount = 0;
      }
    });
  }

  onFilterChange(filter: 'all' | 'unread' | 'read'): void {
    this.selectedFilter = filter;
    this.currentPage = 1;
    this.loadNotifications();
  }

  onTypeChange(type: NotificationType | 'all'): void {
    this.selectedType = type;
    this.currentPage = 1;
    this.loadNotifications();
  }

  markAsRead(notificationId: number | undefined): void {
    if (!notificationId) {
      console.error('Notification ID is required');
      return;
    }

    this.notificationService.markAsRead({ notificationId }).subscribe({
      next: () => {
        const notification = this.notifications.find(n => {
          const id = n.notificationId || n.id;
          return id === notificationId;
        });
        if (notification) {
          notification.isRead = true;
          notification.readAt = new Date();
        }
        // Sử dụng setTimeout để tránh ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.loadUnreadCount();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Error marking as read:', error);
      }
    });
  }

  // Helper method để lấy notificationId từ notification object
  private getNotificationId(notification: Notification): number | undefined {
    return notification.notificationId || notification.id;
  }

  markAllAsRead(): void {
    const unreadCount = this.notifications.filter(n => !n.isRead).length;
    if (unreadCount === 0) {
      return; // Không có thông báo chưa đọc
    }

    // Gọi endpoint mark-all-as-read thay vì markAsRead với array
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // Cập nhật tất cả notifications thành đã đọc
        this.notifications.forEach(n => {
          if (!n.isRead) {
            n.isRead = true;
            n.readAt = new Date();
          }
        });
        // Sử dụng setTimeout để tránh ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.loadUnreadCount();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
      }
    });
  }

  deleteNotification(notification: Notification | number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      return;
    }

    const notificationId = typeof notification === 'number' 
      ? notification 
      : this.getNotificationId(notification);
    
    if (!notificationId) {
      console.error('Notification ID is required');
      return;
    }

    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => {
          const id = this.getNotificationId(n);
          return id !== notificationId;
        });
        this.total--;
        this.loadUnreadCount();
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
        alert('Không thể xóa thông báo. Vui lòng thử lại.');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  getTimeAgo(date: Date | string): string {
    const now = new Date();
    const notificationDate = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    } else {
      return notificationDate.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  goToDetail(notification: Notification): void {
    const notificationId = notification.notificationId || notification.id;
    if (!notificationId) {
      console.error('Notification ID is required');
      return;
    }

    // Mark as read if unread
    if (!notification.isRead) {
      this.markAsRead(notificationId);
    }
    this.router.navigate(['/player/notifications', notificationId]);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Expose Math to template
  Math = Math;
}
