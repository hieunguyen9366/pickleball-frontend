import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { CreditCardOutline, WalletOutline, SaveOutline } from '@ant-design/icons-angular/icons';
import { SystemSettingsService } from '../../services/system-settings.service';
import { SystemSettings, PaymentMethodConfig } from '../../models/system-settings.model';
import { PaymentMethod } from '../../../player/models/payment.model';
import { ApiService } from '../../../common/api.service';
import { ToastService } from '../../../common/services/toast.service';

@Component({
  selector: 'app-payment-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, IconDirective],
  templateUrl: './payment-settings.component.html',
  styleUrls: ['./payment-settings.component.scss']
})
export class PaymentSettingsComponent implements OnInit {
  private systemSettingsService = inject(SystemSettingsService);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  settings: SystemSettings | null = null;
  isLoading = false;
  error = '';
  isSaving = false;

  paymentMethods: PaymentMethodConfig[] = [];

  constructor() {
    this.iconService.addIcon(CreditCardOutline, WalletOutline, SaveOutline);
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.error = '';

    this.systemSettingsService.getSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.paymentMethods = settings.paymentMethods.length > 0 
          ? [...settings.paymentMethods] 
          : this.getDefaultPaymentMethods();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải cấu hình. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi tải cấu hình');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getDefaultPaymentMethods(): PaymentMethodConfig[] {
    return [
      {
        method: PaymentMethod.CREDIT_CARD,
        enabled: true,
        displayName: 'Thẻ tín dụng/Ghi nợ',
        description: 'Thanh toán qua thẻ Visa, Mastercard'
      },
      {
        method: PaymentMethod.MOMO,
        enabled: true,
        displayName: 'Ví MoMo',
        description: 'Thanh toán qua ví điện tử MoMo'
      },
      {
        method: PaymentMethod.BANK_TRANSFER,
        enabled: true,
        displayName: 'Tiền mặt',
        description: 'Thanh toán bằng tiền mặt khi đến sân'
      }
    ];
  }

  togglePaymentMethod(method: PaymentMethodConfig): void {
    method.enabled = !method.enabled;
  }

  save(): void {
    this.isSaving = true;
    this.error = '';

    const request = {
      minPrice: this.settings?.minPrice || 50000,
      maxPrice: this.settings?.maxPrice || 500000,
      paymentMethods: this.paymentMethods
    };

    this.systemSettingsService.updateSettings(request).subscribe({
      next: (settings) => {
        this.settings = settings;
        this.isSaving = false;
        this.cdr.detectChanges();
        this.toastService.success('Lưu cấu hình thành công!', 'Thành công');
      },
      error: (err) => {
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể lưu cấu hình. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi lưu cấu hình');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }
}

