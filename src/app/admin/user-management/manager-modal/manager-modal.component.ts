import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User, UserRole } from 'src/app/player/models/user.model';
import { UserService } from 'src/app/player/services/user.service';

@Component({
  selector: 'app-manager-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">{{ manager ? 'Chỉnh sửa' : 'Thêm mới' }} Quản lý sân</h4>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <form>
        <div class="mb-3">
          <label class="form-label">Họ tên</label>
          <input type="text" class="form-control" [(ngModel)]="formData.fullName" name="fullName" placeholder="Nhập họ tên">
        </div>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" [(ngModel)]="formData.email" name="email" placeholder="Nhập email">
        </div>
        <div class="mb-3">
          <label class="form-label">Số điện thoại</label>
          <input type="text" class="form-control" [(ngModel)]="formData.phoneNumber" name="phoneNumber" placeholder="Nhập số điện thoại">
        </div>
        <div class="mb-3" *ngIf="!manager"> <!-- Only show password for new managers -->
            <label class="form-label">Mật khẩu</label>
            <input type="password" class="form-control" [(ngModel)]="formData.password" name="password" placeholder="Nhập mật khẩu">
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss()">Hủy</button>
      <button type="button" class="btn btn-primary" (click)="save()">Lưu</button>
    </div>
  `
})
export class ManagerModalComponent {
  activeModal = inject(NgbActiveModal);
  private userService = inject(UserService);

  @Input() manager?: User;

  formData: Partial<User> = {
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: UserRole.COURT_MANAGER
  };

  ngOnInit() {
    if (this.manager) {
      this.formData = { ...this.manager };
    }
  }

  save() {
    if (this.manager) {
      // Update
      this.userService.updateUser(this.manager.userId!, this.formData as User).subscribe(() => {
        this.activeModal.close('saved');
      });
    } else {
      // Create
      this.userService.createUser(this.formData as User).subscribe(() => {
        this.activeModal.close('saved');
      });
    }
  }
}
