import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoginRequest, UserRole } from '../../../models/user.model';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { ApiService } from '../../../../common/api.service';
import {
  MailOutline,
  LockOutline,
  LoginOutline,
  UserAddOutline,
  KeyOutline,
  EyeOutline,
  EyeInvisibleOutline,
  CloseCircleFill,
  GoogleOutline,
  FacebookOutline,
  GoogleCircleFill,
  FacebookFill,
  InfoCircleOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-login',
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
export class LoginComponent {
  private iconService = inject(IconService);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  rememberMe = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {
    // Register icons
    this.iconService.addIcon(
      MailOutline,
      LockOutline,
      LoginOutline,
      UserAddOutline,
      KeyOutline,
      EyeOutline,
      EyeInvisibleOutline,
      CloseCircleFill,
      GoogleOutline,
      FacebookOutline,
      GoogleCircleFill,
      FacebookFill,
      InfoCircleOutline
    );

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
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
          // Redirect based on user role
          if (user.role === UserRole.ADMIN || user.role === UserRole.COURT_MANAGER) {
            // Admin/Manager should go to admin site
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
            this.router.navigateByUrl(returnUrl);
          } else {
            // Customer goes to player site
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/player';
            this.router.navigateByUrl(returnUrl);
          }
        },
        error: (error) => {
          this.errorMessage = this.apiService.extractErrorMessage(error) || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
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

