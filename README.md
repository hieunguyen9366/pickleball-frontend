# HƯỚNG DẪN SETUP FRONTEND - PICKLEBALL COURT MANAGEMENT SYSTEM

## 📋 Mục lục

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt Project](#cài-đặt-project)
3. [Cấu hình môi trường](#cấu-hình-môi-trường)
4. [Chạy Development Server](#chạy-development-server)
5. [Build Production](#build-production)
6. [Deploy lên IIS](#deploy-lên-iis)
7. [Cấu trúc Project](#cấu-trúc-project)
8. [Troubleshooting](#troubleshooting)

---

## Yêu cầu hệ thống

### Phần mềm cần thiết:

- **Node.js**: Version 18.x hoặc 20.x (LTS)
- **npm**: Version 9.x+ (đi kèm với Node.js)
- **Angular CLI**: Version 21.x
- **Git**: Để clone project
- **IIS** (Windows): Nếu deploy lên Windows Server

### Kiểm tra phiên bản:

```bash
node -v      # Phải hiển thị v18.x hoặc v20.x
npm -v       # Phải hiển thị v9.x+
ng version   # Phải hiển thị Angular CLI v21.x
```

---

## Cài đặt Project

### 1. Clone repository

```bash
git clone <repository-url>
cd pickleball-frontend
```

### 2. Cài đặt dependencies

```bash
# Cài đặt tất cả packages
npm install

# Hoặc sử dụng yarn (nếu có)
yarn install
```

**Lưu ý:** Quá trình này có thể mất 5-10 phút tùy vào tốc độ mạng.

### 3. Kiểm tra cấu trúc project

Đảm bảo có các thư mục sau:

```
mantis-free-angular-admin-template/
├── src/
│   ├── app/
│   │   ├── admin/          # Site quản trị
│   │   ├── player/         # Site người dùng
│   │   ├── common/         # Shared components/services
│   │   └── theme/          # Theme components
│   ├── assets/             # Images, fonts, etc.
│   └── environments/       # Environment configs
├── angular.json
├── package.json
└── tsconfig.json
```

---

## Cấu hình môi trường

### 1. Cấu hình API Base URL

Mở file `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // Backend API URL
};
```

Mở file `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://your-production-server:8080/api'  // Production API URL
};
```

**Lưu ý:** 
- Development: `http://localhost:8080/api`
- Production: Thay bằng URL thực tế của backend server

### 2. Cấu hình Proxy (Optional - nếu cần)

Nếu gặp CORS issues trong development, tạo file `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

Cập nhật `angular.json`:

```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

---

## Chạy Development Server

### 1. Khởi động development server

```bash
npm start
# Hoặc
ng serve
```

Server sẽ chạy tại: **http://localhost:4200**

### 2. Khởi động với options

```bash
# Chạy trên port khác
ng serve --port 4201

# Mở browser tự động
ng serve --open

# Chạy với host 0.0.0.0 (cho phép truy cập từ mạng nội bộ)
ng serve --host 0.0.0.0

# Kết hợp
ng serve --port 4201 --open --host 0.0.0.0
```

### 3. Hot Reload

Development server tự động reload khi có thay đổi code. Không cần restart.

### 4. Kiểm tra ứng dụng

Mở browser và truy cập:
- **Player Site**: http://localhost:4200/player
- **Admin Site**: http://localhost:4200/admin

**Login credentials (mặc định từ backend):**
```
Admin: admin@pickleball.com / admin123
Customer: customer1@pickleball.com / customer123
```

---

## Build Production

### 1. Build production

```bash
npm run build
# Hoặc
ng build --configuration production
```

**Kết quả:** Files sẽ được tạo trong thư mục `dist/`

### 2. Build với base-href

Nếu deploy vào subdirectory:

```bash
npm run build-prod
# Hoặc
ng build --configuration production --base-href /angular/free/
```

### 3. Kiểm tra build output

```bash
# Xem nội dung thư mục dist
ls -la dist/
# Hoặc trên Windows
dir dist
```

Đảm bảo có các file:
- `index.html`
- `main.*.js`
- `styles.*.css`
- `assets/`
- Các file JS chunks

### 4. Test production build locally

```bash
# Cài đặt http-server (nếu chưa có)
npm install -g http-server

# Chạy từ thư mục dist
cd dist
http-server -p 4200 -c-1
```

Truy cập: http://localhost:4200

---

## Deploy lên IIS

### 1. Cài đặt IIS và URL Rewrite

**Bước 1:** Cài đặt IIS trên Windows Server

**Bước 2:** Cài đặt [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)

**Bước 3:** Cài đặt [Application Request Routing (ARR)](https://www.iis.net/downloads/microsoft/application-request-routing) (nếu cần reverse proxy)

### 2. Copy files lên server

1. Build production:
   ```bash
   npm run build
   ```

2. Copy toàn bộ nội dung thư mục `dist/` lên server:
   - Ví dụ: `C:\inetpub\wwwroot\pickleball-app\`

### 3. Cấu hình IIS Site

**Bước 1:** Mở IIS Manager

**Bước 2:** Tạo Application Pool:
- Name: `PickleballAppPool`
- .NET CLR Version: `No Managed Code`
- Managed Pipeline Mode: `Integrated`

**Bước 3:** Tạo Website mới:
- Site name: `PickleballApp`
- Physical path: `C:\inetpub\wwwroot\pickleball-app`
- Binding:
  - Type: `http`
  - IP address: `All Unassigned`
  - Port: `80` (hoặc port khác)
  - Host name: `pickleball.local` (optional)

**Bước 4:** Gán Application Pool cho Website

### 4. Cấu hình web.config

Tạo file `web.config` trong thư mục root của website:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Angular Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- CORS Configuration (nếu cần) -->
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Origin" value="*" />
        <add name="Access-Control-Allow-Methods" value="GET, POST, PUT, DELETE, OPTIONS" />
        <add name="Access-Control-Allow-Headers" value="Content-Type, Authorization" />
      </customHeaders>
    </httpProtocol>
    
    <!-- Static file caching -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>
    
    <!-- MIME types -->
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
  </system.webServer>
</configuration>
```

### 5. Cấu hình permissions

**Bước 1:** Set permissions cho thư mục:
- Right-click thư mục website → Properties → Security
- Add `IIS_IUSRS` với quyền `Read & Execute`

**Bước 2:** Set Application Pool identity:
- Application Pool → Advanced Settings → Identity
- Chọn `ApplicationPoolIdentity` hoặc custom user

### 6. Kiểm tra và test

1. Mở browser và truy cập: `http://your-server-ip` hoặc `http://pickleball.local`
2. Kiểm tra console (F12) xem có lỗi không
3. Test các chức năng: login, navigation, API calls

### 7. Cấu hình HTTPS (Optional)

**Bước 1:** Tạo/cài đặt SSL certificate

**Bước 2:** Thêm HTTPS binding trong IIS:
- Type: `https`
- Port: `443`
- SSL certificate: Chọn certificate đã cài

**Bước 3:** Redirect HTTP → HTTPS:
- Thêm rule trong URL Rewrite để redirect tất cả HTTP requests sang HTTPS

---

## Cấu trúc Project

### 1. Cấu trúc thư mục chính

```
src/
├── app/
│   ├── admin/                    # Site quản trị
│   │   ├── dashboard/           # Dashboard
│   │   ├── court-management/    # Quản lý sân
│   │   ├── booking-management/   # Quản lý đặt sân
│   │   ├── user-management/     # Quản lý người dùng
│   │   ├── service-management/  # Quản lý dịch vụ
│   │   ├── reports/             # Báo cáo
│   │   └── system/               # Cấu hình hệ thống
│   │
│   ├── player/                   # Site người dùng
│   │   ├── modules/
│   │   │   ├── authentication/  # Đăng nhập/Đăng ký
│   │   │   ├── court-search/    # Tìm kiếm sân
│   │   │   ├── booking/         # Đặt sân
│   │   │   ├── my-bookings/     # Đặt sân của tôi
│   │   │   ├── notifications/   # Thông báo
│   │   │   └── account/         # Tài khoản
│   │   ├── services/            # Services
│   │   ├── models/              # Models/Interfaces
│   │   └── layouts/             # Layouts
│   │
│   ├── common/                    # Shared
│   │   ├── services/            # Common services
│   │   ├── interceptors/        # HTTP interceptors
│   │   └── guards/              # Route guards
│   │
│   └── theme/                    # Theme components
│       └── shared/
│           └── components/      # Reusable components
│
├── assets/                       # Static assets
│   └── images/                  # Images
│
└── environments/                 # Environment configs
    ├── environment.ts           # Development
    └── environment.prod.ts    # Production
```

### 2. Routing

- **Player routes**: `/player/*`
- **Admin routes**: `/admin/*`
- **Auth routes**: `/player/login`, `/player/register`, etc.

### 3. Services

- `AuthService`: Authentication
- `CourtService`: Court management
- `BookingService`: Booking management
- `UserService`: User management
- `PaymentService`: Payment processing
- `NotificationService`: Notifications
- `ApiService`: Common API utilities

### 4. Models

- `user.model.ts`: User interfaces
- `court.model.ts`: Court interfaces
- `booking.model.ts`: Booking interfaces
- `payment.model.ts`: Payment interfaces
- `notification.model.ts`: Notification interfaces

---

## Troubleshooting

### 1. Lỗi: "Port 4200 already in use"

**Giải pháp:**
```bash
# Chạy trên port khác
ng serve --port 4201

# Hoặc kill process đang dùng port 4200
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4200 | xargs kill -9
```

### 2. Lỗi: "Module not found" hoặc "Cannot find module"

**Giải pháp:**
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install

# Hoặc
npm ci  # Clean install
```

### 3. Lỗi: "CORS policy" khi gọi API

**Giải pháp:**
- Sử dụng proxy config (xem phần [Cấu hình môi trường](#cấu-hình-môi-trường))
- Hoặc cấu hình CORS ở backend
- Hoặc disable CORS trong browser (chỉ dùng cho development)

### 4. Lỗi: "ng: command not found"

**Giải pháp:**
```bash
# Cài đặt Angular CLI globally
npm install -g @angular/cli

# Hoặc sử dụng npx
npx ng serve
```

### 5. Lỗi: "Out of memory" khi build

**Giải pháp:**
```bash
# Tăng Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Windows (PowerShell)
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Sau đó build lại
npm run build
```

### 6. Lỗi: "Cannot GET /" sau khi deploy lên IIS

**Giải pháp:**
- Đảm bảo đã cài URL Rewrite Module
- Kiểm tra `web.config` đã được tạo và cấu hình đúng
- Kiểm tra Application Pool đang chạy
- Kiểm tra permissions của thư mục

### 7. Lỗi: "404 Not Found" khi navigate giữa các routes

**Giải pháp:**
- Đảm bảo `web.config` có rule rewrite về `index.html`
- Kiểm tra base-href trong `angular.json` và `index.html`
- Clear browser cache

### 8. Lỗi: "API calls fail" sau khi deploy

**Kiểm tra:**
1. Backend đang chạy và accessible
2. API URL trong `environment.prod.ts` đúng
3. CORS đã được cấu hình ở backend
4. Network/Firewall không chặn requests

**Test:**
```bash
# Test API từ server
curl http://your-backend-server:8080/api/health
```

### 9. Lỗi: "Styles không load" hoặc "Fonts không hiển thị"

**Giải pháp:**
- Kiểm tra đường dẫn assets trong `angular.json`
- Kiểm tra MIME types trong IIS (xem phần [Deploy lên IIS](#deploy-lên-iis))
- Clear browser cache
- Kiểm tra file permissions

### 10. Lỗi: "Build fails" với TypeScript errors

**Giểm tra:**
1. TypeScript version tương thích
2. Tất cả dependencies đã được cài đặt
3. Không có syntax errors trong code

**Giải pháp:**
```bash
# Check TypeScript version
npm list typescript

# Update nếu cần
npm install typescript@latest --save-dev

# Clean và rebuild
npm run build
```

### 11. Lỗi: "Angular version mismatch"

**Giải pháp:**
```bash
# Kiểm tra versions
ng version

# Update Angular CLI
npm install -g @angular/cli@latest

# Update project dependencies
ng update @angular/core @angular/cli
```

### 12. Lỗi: "IIS 500 Error" sau khi deploy

**Kiểm tra:**
1. Application Pool đang chạy
2. Permissions của thư mục
3. `web.config` không có syntax errors
4. Windows Event Viewer để xem chi tiết lỗi

**Giải pháp:**
- Enable detailed errors trong IIS
- Check Application Pool logs
- Verify file paths và permissions

---

## 📝 GHI CHÚ QUAN TRỌNG

### 1. Environment Variables

Trong production, nên sử dụng environment variables thay vì hardcode:
- API URL
- Feature flags
- Third-party API keys

### 2. Security

- Không commit `environment.prod.ts` với sensitive data lên Git
- Sử dụng HTTPS trong production
- Enable Content Security Policy (CSP)
- Sanitize user inputs

### 3. Performance

- Enable production optimizations (`ng build --configuration production`)
- Enable compression trong IIS
- Setup CDN cho static assets
- Lazy load modules khi có thể

### 4. Monitoring

- Setup error tracking (Sentry, etc.)
- Monitor API response times
- Track user analytics
- Log important events

### 5. Backup

- Backup source code
- Document deployment process
- Version control all changes

---

## 🔗 TÀI LIỆU THAM KHẢO

- [Angular Documentation](https://angular.io/docs)
- [Angular CLI Documentation](https://angular.io/cli)
- [IIS Documentation](https://docs.microsoft.com/en-us/iis/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. Browser console (F12) để xem errors
2. Network tab để xem API calls
3. Server logs (nếu có)
4. IIS logs: `C:\inetpub\logs\LogFiles\`
5. Angular build logs

---

## 🚀 QUICK START

**Development:**
```bash
npm install
npm start
# Mở http://localhost:4200
```

**Production Build:**
```bash
npm run build
# Copy dist/ lên IIS server
```

**Deploy:**
1. Build: `npm run build`
2. Copy `dist/` → IIS server
3. Cấu hình IIS site
4. Tạo `web.config`
5. Test!

