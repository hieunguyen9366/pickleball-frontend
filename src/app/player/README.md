# SITE NGƯỜI CHƠI - CẤU TRÚC DỰ ÁN

## Tổng quan

Module này chứa toàn bộ code cho **Site Người chơi** của hệ thống Quản lý và cho thuê sân Pickleball.

## Cấu trúc thư mục

```
player/
├── modules/                    # Các module chức năng
│   ├── authentication/         # Xác thực
│   ├── account/                # Quản lý tài khoản
│   ├── court-search/           # Tìm kiếm sân
│   ├── booking/                # Đặt sân
│   ├── my-bookings/           # Quản lý đặt sân
│   └── notifications/          # Thông báo
├── services/                   # Services
├── models/                     # Models/Interfaces
├── guards/                     # Route guards
├── interceptors/              # HTTP interceptors
├── layouts/                    # Layouts
├── player-routing.module.ts    # Routing module
└── player.module.ts            # Module chính
```

## Các chức năng đã được tạo

### ✅ Models (Interfaces)
- [x] `user.model.ts` - User, LoginRequest, RegisterRequest, AuthResponse
- [x] `court.model.ts` - Court, CourtGroup, TimeSlot, CourtSearchRequest
- [x] `booking.model.ts` - Booking, CreateBookingRequest, BookingStatus
- [x] `service.model.ts` - Service, ServiceStatus
- [x] `payment.model.ts` - Payment, PaymentRequest, PaymentMethod
- [x] `notification.model.ts` - Notification, NotificationType

### ✅ Services
- [x] `auth.service.ts` - Xác thực, đăng nhập, đăng ký
- [x] `court.service.ts` - Tìm kiếm sân, lấy thông tin sân
- [x] `booking.service.ts` - Tạo đặt sân, quản lý đặt sân
- [x] `notification.service.ts` - Quản lý thông báo
- [x] `payment.service.ts` - Xử lý thanh toán
- [x] `service.service.ts` - Quản lý dịch vụ

### ✅ Guards
- [x] `auth.guard.ts` - Bảo vệ route yêu cầu đăng nhập
- [x] `guest.guard.ts` - Bảo vệ route chỉ dành cho guest

### ✅ Interceptors
- [x] `auth.interceptor.ts` - Thêm token vào header
- [x] `error.interceptor.ts` - Xử lý lỗi chung

### ✅ Layout
- [x] `player-layout.component.ts` - Layout chính
- [x] `player-layout.component.html` - Template layout
- [x] `player-layout.component.scss` - Styles layout

### ✅ Routing
- [x] `player-routing.module.ts` - Định nghĩa routes
- [x] Tích hợp vào `app-routing.module.ts`

## Các component cần tạo tiếp theo

### 🔲 Authentication Module
- [ ] `register/register.component.ts` - Đăng ký tài khoản
- [ ] `login/login.component.ts` - Đăng nhập
- [ ] `forgot-password/forgot-password.component.ts` - Quên mật khẩu

### 🔲 Account Module
- [ ] `profile/profile.component.ts` - Thông tin cá nhân
- [ ] `change-password/change-password.component.ts` - Đổi mật khẩu

### 🔲 Court Search Module
- [ ] `search/search.component.ts` - Tìm kiếm sân
- [ ] `detail/detail.component.ts` - Chi tiết sân

### 🔲 Booking Module
- [ ] `select-court/select-court.component.ts` - Chọn sân và khung giờ
- [ ] `select-services/select-services.component.ts` - Chọn dịch vụ
- [ ] `payment/payment.component.ts` - Thanh toán
- [ ] `confirmation/confirmation.component.ts` - Xác nhận đặt sân

### 🔲 My Bookings Module
- [ ] `list/list.component.ts` - Danh sách đặt sân
- [ ] `detail/detail.component.ts` - Chi tiết đặt sân
- [ ] `cancel/cancel.component.ts` - Hủy đặt sân

### 🔲 Notifications Module
- [ ] `list/list.component.ts` - Danh sách thông báo
- [ ] `detail/detail.component.ts` - Chi tiết thông báo

## Routes đã định nghĩa

### Public Routes (Không cần đăng nhập)
- `/player` - Trang chủ (redirect đến court-search)
- `/player/court-search` - Tìm kiếm sân
- `/player/court-detail/:id` - Chi tiết sân

### Guest Only Routes (Chỉ dành cho người chưa đăng nhập)
- `/player/login` - Đăng nhập
- `/player/register` - Đăng ký
- `/player/forgot-password` - Quên mật khẩu

### Auth Required Routes (Yêu cầu đăng nhập)
- `/player/account/profile` - Thông tin cá nhân
- `/player/account/change-password` - Đổi mật khẩu
- `/player/booking/select-court` - Chọn sân
- `/player/booking/select-services` - Chọn dịch vụ
- `/player/booking/payment` - Thanh toán
- `/player/booking/confirmation/:id` - Xác nhận
- `/player/my-bookings` - Danh sách đặt sân
- `/player/my-bookings/:id` - Chi tiết đặt sân
- `/player/my-bookings/:id/cancel` - Hủy đặt sân
- `/player/notifications` - Danh sách thông báo
- `/player/notifications/:id` - Chi tiết thông báo

## Cách sử dụng

### 1. Import PlayerModule vào AppModule

```typescript
import { PlayerModule } from './player/player.module';

@NgModule({
  imports: [
    // ... other imports
    PlayerModule
  ]
})
export class AppModule {}
```

### 2. Cấu hình API URL

Các service sử dụng `/api/...` làm base URL. Cần cấu hình trong `environment.ts`:

```typescript
export const environment = {
  apiUrl: 'http://localhost:8080/api'
};
```

Và cập nhật các service để sử dụng `environment.apiUrl`.

### 3. Tạo các component

Sử dụng Angular CLI để tạo các component:

```bash
ng generate component player/modules/authentication/login --standalone
ng generate component player/modules/authentication/register --standalone
# ... và các component khác
```

## Lưu ý

1. **Standalone Components**: Tất cả các component được tạo là standalone components (Angular 14+)
2. **Lazy Loading**: Các route sử dụng lazy loading để tối ưu performance
3. **Guards**: Sử dụng functional guards (Angular 15+)
4. **Interceptors**: Sử dụng functional interceptors (Angular 15+)
5. **Observables**: Các service sử dụng RxJS Observables

## Bước tiếp theo

1. Tạo các component cho từng module
2. Tạo shared components (nếu cần)
3. Tạo pipes và directives (nếu cần)
4. Tích hợp với backend API
5. Thêm validation và error handling
6. Thêm unit tests và e2e tests




