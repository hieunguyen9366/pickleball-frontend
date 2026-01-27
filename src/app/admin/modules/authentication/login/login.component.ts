import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../player/services/auth.service';
import { LoginRequest, UserRole } from '../../../../player/models/user.model';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { ApiService } from '../../../../common/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import {
  MailOutline,
  LockOutline,
  LoginOutline,
  EyeOutline,
  EyeInvisibleOutline,
  CloseCircleFill
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardComponent,
    IconDirective
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class AdminLoginComponent {
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Register icons
    this.iconService.addIcon(
      MailOutline,
      LockOutline,
      LoginOutline,
      EyeOutline,
      EyeInvisibleOutline,
      CloseCircleFill
    );

    this.loginForm = this.fb.group({
      email: ['admin@pickleball.com', [Validators.required, Validators.email]],
      password: ['123456', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          const user = response.user;
          // Check if user is admin or manager
          if (user.role === UserRole.ADMIN || user.role === UserRole.COURT_MANAGER) {
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
            this.router.navigate([returnUrl]);
          } else {
            // If customer tries to login to admin, redirect to player site
            this.authService.logout();
            this.errorMessage = 'Bạn không có quyền truy cập trang quản trị.';
            this.isLoading = false;
          }
        },
        error: (error: HttpErrorResponse) => {
          // Sử dụng ApiService.extractErrorMessage() để thống nhất
          this.errorMessage = this.apiService.extractErrorMessage(error) || 
                            'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
          this.isLoading = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}

