import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RegisterRequest } from '../../../models/user.model';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { ApiService } from '../../../../common/api.service';
import {
  UserOutline,
  MailOutline,
  PhoneOutline,
  LockOutline,
  EyeOutline,
  EyeInvisibleOutline,
  UserAddOutline,
  CloseCircleFill,
  GoogleOutline,
  FacebookOutline,
  GoogleCircleFill,
  FacebookFill,
  LoginOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardComponent,
    IconDirective
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private iconService = inject(IconService);
  
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService
  ) {
    // Register icons
    this.iconService.addIcon(
      UserOutline,
      MailOutline,
      PhoneOutline,
      LockOutline,
      EyeOutline,
      EyeInvisibleOutline,
      UserAddOutline,
      CloseCircleFill,
      GoogleOutline,
      FacebookOutline,
      GoogleCircleFill,
      FacebookFill,
      LoginOutline
    );

    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const registerData: RegisterRequest = {
        fullName: this.registerForm.value.fullName,
        email: this.registerForm.value.email,
        phoneNumber: this.registerForm.value.phoneNumber,
        password: this.registerForm.value.password
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          // Backend đã gửi email verification, thông báo cho user
          // Nếu user chưa verify email, có thể redirect đến trang verify hoặc hiển thị thông báo
          // Tạm thời navigate đến landing page với thông báo
          this.router.navigate(['/player/landing'], {
            queryParams: { registered: 'true' }
          });
        },
        error: (error) => {
          this.errorMessage = this.apiService.extractErrorMessage(error) || 'Đăng ký thất bại. Vui lòng thử lại.';
          this.isLoading = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
}

