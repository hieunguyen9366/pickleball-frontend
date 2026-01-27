import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from 'src/app/player/services/user.service';
import { User, UserRole } from 'src/app/player/models/user.model';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { EditOutline, DeleteOutline, PlusOutline, SafetyCertificateOutline, KeyOutline } from '@ant-design/icons-angular/icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ManagerModalComponent } from '../manager-modal/manager-modal.component';
import { ApiService } from 'src/app/common/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from 'src/app/common/services/toast.service';

@Component({
    selector: 'app-manager-list',
    standalone: true,
    imports: [CommonModule, RouterModule, CardComponent, IconDirective],
    template: `
    <app-card cardTitle="Danh sách Quản lý sân" [padding]="0">
      <ng-template #headerOptionsTemplate>
        <button class="btn btn-primary" (click)="openModal()">
          <i antIcon type="plus" theme="outline" class="me-1"></i> Thêm Quản lý
        </button>
      </ng-template>
      
      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="text-muted mt-3 mb-0">Đang tải danh sách quản lý...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading" class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Ngày tạo</th>
              <th class="text-end">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let manager of managers">
              <td>#{{ manager.userId }}</td>
              <td>
                <div class="d-flex align-items-center">
                    <div class="flex-shrink-0">
                        <img src="assets/images/user/avatar-2.jpg" alt="user-image" class="user-avatar wid-35 rounded-circle" />
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <h6 class="mb-0">{{ manager.fullName }}</h6>
                    </div>
                </div>
              </td>
              <td>{{ manager.email }}</td>
              <td>{{ manager.phoneNumber }}</td>
              <td>{{ manager.createdAt | date:'dd/MM/yyyy' }}</td>
              <td class="text-end">
                <button class="btn btn-link-primary btn-sm me-1" 
                        [routerLink]="['/admin/user-management/managers', manager.userId, 'assignment']"
                        title="Phân quyền">
                  <i antIcon type="safety-certificate" theme="outline"></i>
                </button>
                <button class="btn btn-link-warning btn-sm me-1" 
                        (click)="resetPassword(manager)" 
                        title="Cấp lại mật khẩu">
                  <i antIcon type="key" theme="outline"></i>
                </button>
                <button class="btn btn-link-success btn-sm me-1" (click)="openModal(manager)" title="Chỉnh sửa">
                  <i antIcon type="edit" theme="outline"></i>
                </button>
                <button class="btn btn-link-danger btn-sm" (click)="deleteManager(manager.userId!)" title="Xóa">
                  <i antIcon type="delete" theme="outline"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="managers.length === 0">
                <td colspan="6" class="text-center py-3">Chưa có quản lý nào.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </app-card>
    `
})
export class ManagerListComponent implements OnInit {
    private userService = inject(UserService);
    private modalService = inject(NgbModal);
    private router = inject(Router);
    private iconService = inject(IconService);
    private apiService = inject(ApiService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    managers: User[] = [];
    isLoading = false;

    constructor() {
        this.iconService.addIcon(EditOutline, DeleteOutline, PlusOutline, SafetyCertificateOutline, KeyOutline);
    }

    ngOnInit() {
        this.loadManagers();
    }

    loadManagers() {
        this.isLoading = true;
        this.userService.getUsersByRole(UserRole.COURT_MANAGER).subscribe({
            next: (data) => {
                this.managers = data || [];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err: HttpErrorResponse) => {
                console.error(err);
                const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải danh sách quản lý. Vui lòng thử lại sau.';
                this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
                this.managers = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openModal(manager?: User) {
        const modalRef = this.modalService.open(ManagerModalComponent, { 
            centered: true,
            size: 'lg'
        });
        modalRef.componentInstance.manager = manager;
        modalRef.result.then((result) => {
            if (result === 'saved') {
                setTimeout(() => {
                    this.loadManagers();
                }, 100);
            }
        }).catch(() => {
            // Modal dismissed, do nothing
        });
    }

    deleteManager(id: number) {
        if (confirm('Bạn có chắc chắn muốn xóa quản lý này?')) {
            this.isLoading = true;
            this.cdr.detectChanges();
            
            this.userService.deleteUser(id).subscribe({
                next: () => {
                    this.toastService.success('Xóa quản lý thành công!', 'Thành công');
                    this.loadManagers();
                },
                error: (err: HttpErrorResponse) => {
                    console.error('Failed to delete manager', err);
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể xóa quản lý. Vui lòng thử lại sau.';
                    this.toastService.error(errorMsg, 'Lỗi xóa');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    resetPassword(manager: User) {
        if (confirm(`Bạn có chắc chắn muốn cấp lại mật khẩu cho ${manager.fullName}? Mật khẩu mới sẽ được hiển thị sau khi reset.`)) {
            this.isLoading = true;
            this.cdr.detectChanges();
            
            this.userService.resetPassword(manager.userId!).subscribe({
                next: (response) => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    // Show password in alert (as requested) but also show success toast
                    this.toastService.success('Cấp lại mật khẩu thành công!', 'Thành công');
                    alert(`Mật khẩu mới cho ${manager.fullName}:\n\n${response.newPassword}\n\nVui lòng lưu lại mật khẩu này và gửi cho quản lý.`);
                },
                error: (err: HttpErrorResponse) => {
                    console.error(err);
                    const errorMsg = this.apiService.extractErrorMessage(err) || 
                                   'Không thể cấp lại mật khẩu. Vui lòng thử lại.';
                    this.toastService.error(errorMsg, 'Lỗi cấp lại mật khẩu');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }
}
