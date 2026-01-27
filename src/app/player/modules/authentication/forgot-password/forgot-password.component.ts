import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../../common/api.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.forgotPassword(this.forgotPasswordForm.value).subscribe({
        next: () => {
          this.successMessage = 'Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.';
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          // Extract error message using ApiService method (thống nhất)
          this.errorMessage = this.apiService.extractErrorMessage(error) || 
                            'Gửi email thất bại. Vui lòng thử lại.';
          this.isLoading = false;
        }
      });
    }
  }
}




