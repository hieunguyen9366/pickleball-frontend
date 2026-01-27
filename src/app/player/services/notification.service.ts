import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Notification, 
  NotificationListRequest, 
  NotificationListResponse,
  MarkAsReadRequest
} from '../models/notification.model';
import { ApiService } from '../../common/api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private apiService: ApiService) {}

  getNotifications(request?: NotificationListRequest): Observable<NotificationListResponse> {
    const params: any = {
      page: request?.page || 1,
      pageSize: request?.pageSize || 10
    };

    if (request?.userId) params.userId = request.userId;
    if (request?.type) params.type = request.type;
    if (request?.isRead !== undefined) params.isRead = request.isRead;

    return this.apiService.get<NotificationListResponse>('notifications', { params }).pipe(
      map((response: any) => {
        // Map 'id' từ backend sang 'notificationId' cho frontend
        if (response.notifications) {
          response.notifications = response.notifications.map((n: any) => ({
            ...n,
            notificationId: n.id || n.notificationId,
            id: n.id || n.notificationId
          }));
        }
        return response;
      }),
      catchError(error => {
        console.error('Error loading notifications:', error);
        return throwError(() => error);
      })
    );
  }

  getNotificationById(notificationId: number): Observable<Notification> {
    return this.apiService.get<Notification>(`notifications/${notificationId}`).pipe(
      map((notification: any) => ({
        ...notification,
        notificationId: notification.id || notification.notificationId,
        id: notification.id || notification.notificationId
      })),
      catchError(error => {
        console.error('Error loading notification:', error);
        return throwError(() => error);
      })
    );
  }

  markAsRead(request: MarkAsReadRequest): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>('notifications/mark-as-read', request).pipe(
      catchError(error => {
        console.error('Error marking as read:', error);
        return throwError(() => error);
      })
    );
  }

  markAllAsRead(): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>('notifications/mark-all-as-read', {}).pipe(
      catchError(error => {
        console.error('Error marking all as read:', error);
        return throwError(() => error);
      })
    );
  }

  deleteNotification(notificationId: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`notifications/${notificationId}`).pipe(
      catchError(error => {
        console.error('Error deleting notification:', error);
        return throwError(() => error);
      })
    );
  }

  getUnreadCount(): Observable<number> {
    // Backend trả về Long trực tiếp, ApiService sẽ extract data từ ApiResponse
    return this.apiService.get<number>('notifications/unread-count').pipe(
      catchError(error => {
        console.error('Error loading unread count:', error);
        return throwError(() => error);
      })
    );
  }

}

