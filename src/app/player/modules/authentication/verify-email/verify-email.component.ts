import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../../common/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { CheckCircleOutline, CloseCircleOutline, LoadingOutline } from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, IconDirective],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  private iconService = inject(IconService);
  
  isLoading = true;
  isSuccess = false;
  errorMessage = '';
  token = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {
    this.iconService.addIcon(CheckCircleOutline, CloseCircleOutline, LoadingOutline);
  }

  ngOnInit(): void {
    // Lấy token từ query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (this.token) {
        this.verifyEmail();
      } else {
        this.errorMessage = 'Token không hợp lệ. Vui lòng kiểm tra lại link.';
        this.isLoading = false;
      }
    });
  }

  verifyEmail(): void {
    if (!this.token) {
      this.errorMessage = 'Token không hợp lệ.';
      this.isLoading = false;
      return;
    }

    // Gọi API verify email
    // Note: AuthService chưa có verifyEmail method, cần thêm vào
    this.apiService.get<{ message: string }>('auth/verify-email', {
      params: { token: this.token }
    }).subscribe({
      next: (response: any) => {
        this.isSuccess = true;
        this.isLoading = false;
        
        // Redirect về login sau 3 giây
        setTimeout(() => {
          this.router.navigate(['/player/login']);
        }, 3000);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.apiService.extractErrorMessage(error) || 
                          'Không thể xác thực email. Token có thể đã hết hạn.';
        this.isLoading = false;
      }
    });
  }
}

