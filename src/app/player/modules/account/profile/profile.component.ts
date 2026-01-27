import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User, UpdateProfileRequest, ChangePasswordRequest } from '../../../models/user.model';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { ApiService } from '../../../../common/api.service';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import {
  UserOutline,
  MailOutline,
  PhoneOutline,
  EditOutline,
  SaveOutline,
  CameraOutline,
  CalendarOutline,
  CheckCircleOutline,
  LockOutline,
  EyeOutline,
  EyeInvisibleOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardComponent,
    IconDirective,
    NgbNavModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private iconService = inject(IconService);

  profileForm: FormGroup;
  changePasswordForm: FormGroup;
  currentUser: User | null = null;
  isLoading = false;
  isChangingPassword = false;
  isEditing = false;
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';
  avatarPreview: string | null = null;
  
  // Password visibility toggles
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  
  // Active tab
  activeTab = 1;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService
  ) {
    // Register icons
    this.iconService.addIcon(
      UserOutline,
      MailOutline,
      PhoneOutline,
      EditOutline,
      SaveOutline,
      CameraOutline,
      CalendarOutline,
      CheckCircleOutline,
      LockOutline,
      EyeOutline,
      EyeInvisibleOutline
    );

    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }], // Email không thể chỉnh sửa
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      avatar: ['']
    });

    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        fullName: this.currentUser.fullName,
        email: this.currentUser.email,
        phoneNumber: this.currentUser.phoneNumber || '',
        avatar: this.currentUser.avatar || ''
      });
      this.avatarPreview = this.currentUser.avatar || null;
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.isEditing) {
      this.profileForm.get('fullName')?.enable();
      this.profileForm.get('phoneNumber')?.enable();
    } else {
      // Reset form to original values
      this.loadUserProfile();
      this.profileForm.get('fullName')?.disable();
      this.profileForm.get('phoneNumber')?.disable();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Vui lòng chọn file ảnh';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Kích thước file không được vượt quá 5MB';
        return;
      }

      // Preview image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
        this.profileForm.patchValue({ avatar: this.avatarPreview });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid && this.isEditing) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';

      const updateData: UpdateProfileRequest = {
        fullName: this.profileForm.value.fullName,
        phoneNumber: this.profileForm.value.phoneNumber,
        avatar: this.profileForm.value.avatar || undefined
      };

      this.authService.updateProfile(updateData).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.isLoading = false;
          this.isEditing = false;
          this.profileForm.get('fullName')?.disable();
          this.profileForm.get('phoneNumber')?.disable();
          
          // Reload user profile
          setTimeout(() => {
            this.loadUserProfile();
          }, 500);
        },
        error: (error) => {
          this.errorMessage = this.apiService.extractErrorMessage(error) || 'Cập nhật thông tin thất bại. Vui lòng thử lại.';
          this.isLoading = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
    }
  }

  onSubmitChangePassword(): void {
    if (this.changePasswordForm.valid) {
      this.isChangingPassword = true;
      this.passwordSuccessMessage = '';
      this.passwordErrorMessage = '';

      const changePasswordData: ChangePasswordRequest = {
        currentPassword: this.changePasswordForm.value.currentPassword,
        newPassword: this.changePasswordForm.value.newPassword,
        confirmPassword: this.changePasswordForm.value.confirmPassword
      };

      this.authService.changePassword(changePasswordData).subscribe({
        next: (response) => {
          this.passwordSuccessMessage = response.message;
          this.isChangingPassword = false;
          this.changePasswordForm.reset();
          this.showCurrentPassword = false;
          this.showNewPassword = false;
          this.showConfirmPassword = false;
        },
        error: (error) => {
          this.passwordErrorMessage = this.apiService.extractErrorMessage(error) || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
          this.isChangingPassword = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  getFormattedDate(date: Date | string | undefined): string {
    if (!date) return 'Chưa cập nhật';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
