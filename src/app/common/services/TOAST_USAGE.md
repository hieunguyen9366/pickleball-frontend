# Hướng Dẫn Sử Dụng Toast Service

## Tổng Quan

Toast Service cung cấp hệ thống hiển thị thông báo toàn cục cho ứng dụng. Tự động hiển thị lỗi từ API và cho phép hiển thị thông báo thành công, cảnh báo, thông tin.

## Tự Động Hiển Thị Lỗi

Toast Service đã được tích hợp vào:
- **ApiService**: Tự động hiển thị toast lỗi khi API call thất bại
- **ErrorInterceptor**: Hiển thị toast cho các lỗi HTTP (401, 403, 500, etc.)

**Lưu ý**: Lỗi 401 (Unauthorized) sẽ tự động redirect về trang login và hiển thị toast.

## Sử Dụng Thủ Công

### Import ToastService

```typescript
import { ToastService } from 'src/app/common/services/toast.service';

constructor(private toastService: ToastService) {}
```

### Các Methods

#### 1. Success Toast
```typescript
this.toastService.success('Thao tác thành công!');
this.toastService.success('Đã lưu thông tin', 'Thành công');
this.toastService.success('Đã xóa', 'Xóa thành công', 3000); // Custom duration
```

#### 2. Error Toast
```typescript
this.toastService.error('Đã xảy ra lỗi');
this.toastService.error('Không thể kết nối server', 'Lỗi kết nối');
this.toastService.error('Lỗi validation', 'Lỗi', 10000); // Custom duration
```

#### 3. Warning Toast
```typescript
this.toastService.warning('Vui lòng kiểm tra lại thông tin');
this.toastService.warning('Dữ liệu có thể không chính xác', 'Cảnh báo');
```

#### 4. Info Toast
```typescript
this.toastService.info('Thông tin quan trọng');
this.toastService.info('Hệ thống sẽ bảo trì vào 2h sáng', 'Thông báo');
```

### Ví Dụ Sử Dụng

#### Trong Component
```typescript
import { Component, inject } from '@angular/core';
import { ToastService } from 'src/app/common/services/toast.service';
import { BookingService } from 'src/app/player/services/booking.service';

@Component({...})
export class BookingComponent {
  private toastService = inject(ToastService);
  private bookingService = inject(BookingService);

  createBooking() {
    this.bookingService.createBooking(data).subscribe({
      next: () => {
        this.toastService.success('Đặt sân thành công!', 'Thành công');
      },
      error: (error) => {
        // Error toast đã được hiển thị tự động bởi ApiService
        // Có thể thêm xử lý riêng nếu cần
        console.error('Booking error:', error);
      }
    });
  }
}
```

#### Tắt Tự Động Hiển Thị Lỗi (Nếu Cần)
```typescript
// Trong component hoặc service
this.apiService.setErrorToastEnabled(false);
// ... make API call
this.apiService.setErrorToastEnabled(true); // Bật lại
```

## Cấu Hình

### Thời Gian Hiển Thị Mặc Định
- **Success**: 5 giây
- **Error**: 7 giây (lâu hơn để user đọc)
- **Warning**: 5 giây
- **Info**: 5 giây

### Tùy Chỉnh Thời Gian
```typescript
// Hiển thị 10 giây
this.toastService.error('Lỗi quan trọng', 'Lỗi', 10000);

// Không tự động đóng (duration = 0)
this.toastService.warning('Vui lòng xác nhận', 'Cảnh báo', 0);
```

## Vị Trí Hiển Thị

Toast hiển thị ở góc trên bên phải màn hình:
- Desktop: Top-right, max-width 400px
- Mobile: Top, full width với margin 10px

## Styling

Toast có 4 loại với màu sắc riêng:
- **Success**: Xanh lá (#52c41a)
- **Error**: Đỏ (#ff4d4f)
- **Warning**: Vàng (#faad14)
- **Info**: Xanh dương (#1890ff)

## Best Practices

1. **Không cần gọi error toast thủ công** khi sử dụng ApiService - đã tự động
2. **Gọi success toast** sau các thao tác thành công (create, update, delete)
3. **Sử dụng warning** cho các cảnh báo không phải lỗi
4. **Sử dụng info** cho thông tin quan trọng
5. **Tắt auto error toast** chỉ khi cần xử lý lỗi riêng

## Ví Dụ Thực Tế

```typescript
// Create booking
this.bookingService.createBooking(data).subscribe({
  next: () => {
    this.toastService.success('Đặt sân thành công!');
    this.router.navigate(['/player/bookings']);
  }
  // Error đã được xử lý tự động
});

// Delete với confirmation
deleteItem(id: number) {
  if (confirm('Bạn có chắc muốn xóa?')) {
    this.service.delete(id).subscribe({
      next: () => {
        this.toastService.success('Đã xóa thành công');
        this.loadData();
      }
    });
  }
}

// Update với custom message
updateProfile(data: any) {
  this.authService.updateProfile(data).subscribe({
    next: (response) => {
      this.toastService.success(response.message || 'Cập nhật thành công');
    }
  });
}
```



