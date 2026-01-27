import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from 'src/app/player/services/user.service';
import { User, UserRole } from 'src/app/player/models/user.model';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { EyeOutline, StopOutline, UnlockOutline } from '@ant-design/icons-angular/icons';
import { ApiService } from 'src/app/common/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from 'src/app/common/services/toast.service';

@Component({
    selector: 'app-customer-list',
    standalone: true,
    imports: [CommonModule, RouterModule, CardComponent, IconDirective],
    template: `
    <app-card cardTitle="Danh sách Khách hàng" [padding]="0">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Ngày tham gia</th>
              <th class="text-end">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let customer of customers">
              <td>#{{ customer.userId }}</td>
              <td>
                <div class="d-flex align-items-center">
                    <div class="flex-shrink-0">
                        <img src="assets/images/user/avatar-1.jpg" alt="user-image" class="user-avatar wid-35 rounded-circle" />
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <h6 class="mb-0">{{ customer.fullName }}</h6>
                    </div>
                </div>
              </td>
              <td>{{ customer.email }}</td>
              <td>{{ customer.phoneNumber }}</td>
              <td>{{ customer.createdAt | date:'dd/MM/yyyy' }}</td>
              <td class="text-end">
                <button class="btn btn-link-primary btn-sm me-1" 
                        title="Xem lịch sử đặt sân"
                        (click)="viewBookingHistory(customer)">
                  <i antIcon type="eye" theme="outline"></i>
                </button>
                <button class="btn btn-link-danger btn-sm" 
                        [title]="customer.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'"
                        (click)="blockUser(customer)">
                  <i antIcon [type]="customer.status === 'LOCKED' ? 'unlock' : 'stop'" theme="outline"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="customers.length === 0 && !isLoading">
                <td colspan="6" class="text-center py-3">Chưa có khách hàng nào.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </app-card>
    `
})
export class CustomerListComponent implements OnInit {
    private userService = inject(UserService);
    private router = inject(Router);
    private iconService = inject(IconService);
    private apiService = inject(ApiService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    customers: User[] = [];
    isLoading = false;

    constructor() {
        this.iconService.addIcon(EyeOutline, StopOutline, UnlockOutline);
    }

    ngOnInit() {
        this.loadCustomers();
    }

    loadCustomers() {
        this.isLoading = true;
        this.userService.getUsersByRole(UserRole.CUSTOMER).subscribe({
            next: (data) => {
                this.customers = data || [];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err: HttpErrorResponse) => {
                console.error(err);
                const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải danh sách khách hàng. Vui lòng thử lại sau.';
                this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
                this.customers = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    blockUser(user: User) {
        const action = user.status === 'LOCKED' ? 'mở khóa' : 'khóa';
        if (confirm(`Bạn có chắc chắn muốn ${action} tài khoản ${user.fullName}?`)) {
            this.isLoading = true;
            this.cdr.detectChanges();
            
            const action$ = user.status === 'LOCKED' 
                ? this.userService.unblockUser(user.userId!)
                : this.userService.blockUser(user.userId!);
            
            action$.subscribe({
                next: () => {
                    const actionLabel = user.status === 'LOCKED' ? 'Mở khóa' : 'Khóa';
                    this.toastService.success(`${actionLabel} tài khoản thành công!`, 'Thành công');
                    this.loadCustomers();
                },
                error: (err: HttpErrorResponse) => {
                    console.error(err);
                    const errorMsg = this.apiService.extractErrorMessage(err) || 
                                   'Không thể thực hiện thao tác. Vui lòng thử lại.';
                    this.toastService.error(errorMsg, 'Lỗi');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    viewBookingHistory(customer: User) {
        this.router.navigate(['/admin/user-management/customers', customer.userId, 'bookings']);
    }
}
