export interface Notification {
  id?: number; // Backend trả về 'id', map sang notificationId
  notificationId?: number; // Alias cho id để tương thích
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedId?: number; // ID liên quan (bookingId, paymentId, v.v.)
  relatedType?: string; // Loại liên quan (BOOKING, PAYMENT, v.v.)
  createdAt: Date;
  readAt?: Date;
}

export enum NotificationType {
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  CANCELLATION = 'CANCELLATION',
  REMINDER = 'REMINDER',
  GENERAL = 'GENERAL'
}

export interface NotificationListRequest {
  userId?: number;
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MarkAsReadRequest {
  notificationId: number; // Backend nhận notificationId (singular), không phải array
}




