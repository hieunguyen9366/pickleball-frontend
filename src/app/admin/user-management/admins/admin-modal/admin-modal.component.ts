import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User, UserRole } from '../../../../player/models/user.model';
import { UserService } from '../../../../player/services/user.service';
import { ApiService } from '../../../../common/api.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-admin-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-modal.component.html',
    styleUrls: ['./admin-modal.component.scss']
})
export class AdminModalComponent {
    activeModal = inject(NgbActiveModal);
    private userService = inject(UserService);
    private apiService = inject(ApiService);

    @Input() admin?: User;

    formData: Partial<User> = {
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: UserRole.ADMIN
    };

    isLoading = false;
    error = '';

    ngOnInit() {
        if (this.admin) {
            this.formData = { ...this.admin };
        }
    }

    save() {
        if (!this.formData.fullName || !this.formData.email) {
            this.error = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
            return;
        }

        if (!this.admin && !this.formData.password) {
            this.error = 'Vui lòng nhập mật khẩu.';
            return;
        }

        this.isLoading = true;
        this.error = '';

        if (this.admin) {
            // Update
            this.userService.updateUser(this.admin.userId!, this.formData as User).subscribe({
                next: () => {
                    this.activeModal.close('saved');
                },
                error: (err: HttpErrorResponse) => {
                    this.error = this.apiService.extractErrorMessage(err) || 'Không thể cập nhật quản trị viên. Vui lòng thử lại sau.';
                    this.isLoading = false;
                }
            });
        } else {
            // Create
            this.userService.createUser(this.formData as User).subscribe({
                next: () => {
                    this.activeModal.close('saved');
                },
                error: (err: HttpErrorResponse) => {
                    this.error = this.apiService.extractErrorMessage(err) || 'Không thể tạo quản trị viên. Vui lòng thử lại sau.';
                    this.isLoading = false;
                }
            });
        }
    }
}



