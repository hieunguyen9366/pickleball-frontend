import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BookingService } from 'src/app/player/services/booking.service';
import { Booking, BookingStatus } from 'src/app/player/models/booking.model';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { CheckCircleOutline, CloseCircleOutline, EyeOutline, CheckOutline } from '@ant-design/icons-angular/icons';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/common/api.service';
import { ToastService } from 'src/app/common/services/toast.service';

@Component({
    selector: 'app-booking-list',
    standalone: true,
    imports: [CommonModule, RouterModule, CardComponent, IconDirective, FormsModule],
    templateUrl: './booking-list.component.html',
    styleUrls: ['./booking-list.component.scss']
})
export class BookingListComponent implements OnInit {
    private bookingService = inject(BookingService);
    private router = inject(Router);
    private iconService = inject(IconService);
    private apiService = inject(ApiService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    bookings: Booking[] = [];
    isLoading = false;
    error = '';
    selectedStatus: string = '';

    // Mock User Context (Admin by default)
    // Uncomment to test Manager view
    currentUser = { id: 1, role: 'ADMIN' };
    // currentUser = { id: 2, role: 'MANAGER' };

    bookingStatuses = Object.values(BookingStatus);
    BookingStatus = BookingStatus; // Expose enum to template

    constructor() {
        this.iconService.addIcon(CheckCircleOutline, CloseCircleOutline, EyeOutline, CheckOutline);
    }

    ngOnInit(): void {
        this.loadBookings();
    }

    loadBookings(): void {
        this.isLoading = true;
        const request: any = { pageSize: 50 }; // Load 50 recent
        if (this.selectedStatus) {
            request.status = this.selectedStatus;
        }

        if (this.currentUser.role === 'MANAGER') {
            request.managerId = this.currentUser.id;
        }

        this.bookingService.getBookings(request).subscribe({
            next: (response) => {
                this.bookings = response.bookings || [];
                this.isLoading = false;
                this.error = '';
                this.cdr.detectChanges();
            },
            error: (err) => {
                const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải danh sách đặt sân. Vui lòng thử lại sau.';
                this.error = errorMsg;
                this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
                this.bookings = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    updateStatus(id: number, status: BookingStatus): void {
        const statusLabel = this.getStatusLabel(status);
        if (confirm(`Bạn có chắc chắn muốn cập nhật trạng thái thành ${statusLabel} không?`)) {
            this.isLoading = true;
            this.cdr.detectChanges();
            
            this.bookingService.updateBookingStatus(id, status).subscribe({
                next: () => {
                    this.toastService.success(`Cập nhật trạng thái thành ${statusLabel} thành công!`, 'Thành công');
                    this.loadBookings();
                },
                error: (err) => {
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể cập nhật trạng thái. Vui lòng thử lại sau.';
                    this.toastService.error(errorMsg, 'Lỗi cập nhật');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    getStatusClass(status: BookingStatus): string {
        switch (status) {
            case BookingStatus.CONFIRMED: return 'badge bg-light-success text-success';
            case BookingStatus.PAID: return 'badge bg-light-primary text-primary';
            case BookingStatus.PENDING: return 'badge bg-light-warning text-warning';
            case BookingStatus.CANCELLED: return 'badge bg-light-danger text-danger';
            case BookingStatus.COMPLETED: return 'badge bg-light-info text-info';
            default: return 'badge bg-light-secondary text-secondary';
        }
    }

    getStatusLabel(status: BookingStatus): string {
        switch (status) {
            case BookingStatus.CONFIRMED: return 'Đã xác nhận';
            case BookingStatus.PAID: return 'Đã thanh toán';
            case BookingStatus.PENDING: return 'Chờ xử lý';
            case BookingStatus.CANCELLED: return 'Đã hủy';
            case BookingStatus.COMPLETED: return 'Hoàn thành';
            default: return status;
        }
    }

    onStatusFilterChange(): void {
        this.loadBookings();
    }

    viewDetail(bookingId: number): void {
        this.router.navigate(['/admin/booking-management', bookingId]);
    }

    checkIn(booking: Booking): void {
        if (confirm(`Xác nhận check-in cho đặt sân #${booking.bookingId}?`)) {
            this.isLoading = true;
            this.cdr.detectChanges();
            
            this.bookingService.checkIn(booking.bookingId).subscribe({
                next: () => {
                    this.toastService.success('Check-in thành công!', 'Thành công');
                    this.loadBookings();
                },
                error: (err) => {
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể check-in. Vui lòng thử lại sau.';
                    this.toastService.error(errorMsg, 'Lỗi check-in');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    isCheckInAvailable(booking: Booking): boolean {
        // Chỉ cho phép check-in với booking đã xác nhận hoặc đã thanh toán, chưa check-in, và trong ngày đặt sân
        if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PAID) {
            return false;
        }
        if (booking.checkedInAt) {
            return false; // Đã check-in rồi
        }
        // Kiểm tra xem có phải ngày đặt sân không
        const today = new Date().toISOString().split('T')[0];
        return booking.bookingDate === today;
    }
}
