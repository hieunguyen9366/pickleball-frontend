import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../../player/services/user.service';
import { User, UserRole } from '../../../../player/models/user.model';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { EditOutline, DeleteOutline, PlusOutline } from '@ant-design/icons-angular/icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminModalComponent } from '../admin-modal/admin-modal.component';
import { ApiService } from 'src/app/common/api.service';
import { ToastService } from 'src/app/common/services/toast.service';

@Component({
    selector: 'app-admin-list',
    standalone: true,
    imports: [CommonModule, CardComponent, IconDirective],
    templateUrl: './admin-list.component.html',
    styleUrls: ['./admin-list.component.scss']
})
export class AdminListComponent implements OnInit {
    private userService = inject(UserService);
    private modalService = inject(NgbModal);
    private iconService = inject(IconService);
    private apiService = inject(ApiService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    admins: User[] = [];
    isLoading = false;
    error = '';

    constructor() {
        this.iconService.addIcon(EditOutline, DeleteOutline, PlusOutline);
    }

    ngOnInit() {
        this.loadAdmins();
    }

    loadAdmins() {
        this.isLoading = true;
        this.userService.getUsersByRole(UserRole.ADMIN).subscribe({
            next: (data) => {
                this.admins = data || [];
                this.isLoading = false;
                this.error = '';
                this.cdr.detectChanges();
            },
            error: (err) => {
                const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải danh sách quản trị viên. Vui lòng thử lại sau.';
                this.error = errorMsg;
                this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
                this.admins = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openModal(admin?: User) {
        const modalRef = this.modalService.open(AdminModalComponent, { 
            centered: true,
            size: 'lg'
        });
        modalRef.componentInstance.admin = admin;
        modalRef.result.then((result) => {
            if (result === 'saved') {
                setTimeout(() => {
                    this.loadAdmins();
                }, 100);
            }
        }).catch(() => {
            // Modal dismissed, do nothing
        });
    }

    deleteAdmin(id: number) {
        // Không cho phép xóa chính mình
        const currentUser = { id: 1 }; // TODO: Lấy từ AuthService
        if (id === currentUser.id) {
            this.toastService.error('Bạn không thể xóa chính mình.', 'Lỗi');
            return;
        }

        if (confirm('Bạn có chắc chắn muốn xóa quản trị viên này?')) {
            this.isLoading = true;
            this.error = '';
            this.cdr.detectChanges();
            
            this.userService.deleteUser(id).subscribe({
                next: () => {
                    this.toastService.success('Xóa quản trị viên thành công!', 'Thành công');
                    this.loadAdmins();
                },
                error: (err) => {
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể xóa quản trị viên. Vui lòng thử lại sau.';
                    this.toastService.error(errorMsg, 'Lỗi xóa');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }
}



