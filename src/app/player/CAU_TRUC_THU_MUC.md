# CẤU TRÚC THƯ MỤC SITE NGƯỜI CHƠI

## Tổng quan cấu trúc

```
src/app/player/
├── modules/                          # Các module chức năng
│   ├── authentication/              # Module xác thực
│   │   ├── register/                 # Đăng ký tài khoản
│   │   ├── login/                    # Đăng nhập
│   │   └── forgot-password/          # Quên mật khẩu
│   ├── account/                      # Module quản lý tài khoản
│   │   ├── profile/                  # Thông tin cá nhân
│   │   └── change-password/          # Đổi mật khẩu
│   ├── court-search/                 # Module tìm kiếm sân
│   │   ├── search/                   # Tìm kiếm sân
│   │   └── detail/                   # Chi tiết sân
│   ├── booking/                      # Module đặt sân
│   │   ├── select-court/             # Chọn sân và khung giờ
│   │   ├── select-services/          # Chọn dịch vụ đi kèm
│   │   ├── payment/                  # Thanh toán
│   │   └── confirmation/             # Xác nhận đặt sân
│   ├── my-bookings/                  # Module quản lý đặt sân
│   │   ├── list/                     # Danh sách đặt sân
│   │   ├── detail/                   # Chi tiết đặt sân
│   │   └── cancel/                   # Hủy đặt sân
│   └── notifications/                 # Module thông báo
│       ├── list/                     # Danh sách thông báo
│       └── detail/                   # Chi tiết thông báo
├── services/                         # Các service
│   ├── auth.service.ts               # Service xác thực
│   ├── court.service.ts              # Service quản lý sân
│   ├── booking.service.ts            # Service đặt sân
│   ├── notification.service.ts       # Service thông báo
│   └── payment.service.ts            # Service thanh toán
├── models/                           # Models/Interfaces
│   ├── user.model.ts                 # Model người dùng
│   ├── court.model.ts                # Model sân
│   ├── booking.model.ts              # Model đặt sân
│   ├── service.model.ts              # Model dịch vụ
│   ├── notification.model.ts         # Model thông báo
│   └── payment.model.ts              # Model thanh toán
├── guards/                           # Route guards
│   ├── auth.guard.ts                 # Guard xác thực
│   └── guest.guard.ts                # Guard cho guest
├── interceptors/                     # HTTP interceptors
│   ├── auth.interceptor.ts           # Interceptor xác thực
│   └── error.interceptor.ts          # Interceptor xử lý lỗi
├── layouts/                          # Layouts
│   └── player-layout/                # Layout chính cho người chơi
│       ├── player-layout.component.ts
│       ├── player-layout.component.html
│       ├── player-layout.component.scss
│       ├── header/                   # Header component
│       ├── footer/                   # Footer component
│       └── sidebar/                  # Sidebar component (nếu cần)
├── player-routing.module.ts          # Routing module
└── player.module.ts                  # Module chính
```

## Mô tả các module

### 1. Authentication Module
- **register**: Đăng ký tài khoản mới
- **login**: Đăng nhập vào hệ thống
- **forgot-password**: Khôi phục mật khẩu

### 2. Account Module
- **profile**: Xem và cập nhật thông tin cá nhân
- **change-password**: Đổi mật khẩu

### 3. Court Search Module
- **search**: Tìm kiếm sân theo các tiêu chí
- **detail**: Xem chi tiết thông tin sân

### 4. Booking Module
- **select-court**: Chọn sân và khung giờ
- **select-services**: Chọn dịch vụ đi kèm
- **payment**: Thanh toán
- **confirmation**: Xác nhận đặt sân thành công

### 5. My Bookings Module
- **list**: Danh sách các sân đã đặt
- **detail**: Chi tiết một lần đặt sân
- **cancel**: Hủy đặt sân

### 6. Notifications Module
- **list**: Danh sách thông báo
- **detail**: Chi tiết thông báo

## Services

### Auth Service
- Đăng nhập, đăng ký, đăng xuất
- Quản lý token và session
- Xác thực người dùng

### Court Service
- Tìm kiếm sân
- Lấy thông tin chi tiết sân
- Kiểm tra khung giờ trống

### Booking Service
- Tạo đặt sân mới
- Lấy danh sách đặt sân
- Hủy đặt sân
- Xem chi tiết đặt sân

### Notification Service
- Lấy danh sách thông báo
- Đánh dấu đã đọc
- Xóa thông báo

### Payment Service
- Xử lý thanh toán
- Kiểm tra trạng thái thanh toán
- Hoàn tiền

## Guards

### Auth Guard
- Bảo vệ các route yêu cầu đăng nhập
- Redirect về trang login nếu chưa đăng nhập

### Guest Guard
- Bảo vệ các route chỉ dành cho guest (login, register)
- Redirect về trang chủ nếu đã đăng nhập

## Interceptors

### Auth Interceptor
- Thêm token vào header của mọi request
- Xử lý refresh token

### Error Interceptor
- Xử lý lỗi chung
- Hiển thị thông báo lỗi
- Xử lý 401, 403, 500...




