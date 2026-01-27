import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { DollarOutline, SaveOutline } from '@ant-design/icons-angular/icons';
import { SystemSettingsService } from '../../services/system-settings.service';
import { SystemSettings } from '../../models/system-settings.model';
import { ApiService } from '../../../common/api.service';
import { ToastService } from '../../../common/services/toast.service';

@Component({
  selector: 'app-pricing-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, IconDirective],
  templateUrl: './pricing-settings.component.html',
  styleUrls: ['./pricing-settings.component.scss']
})
export class PricingSettingsComponent implements OnInit {
  private systemSettingsService = inject(SystemSettingsService);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  settings: SystemSettings | null = null;
  isLoading = false;
  error = '';
  isSaving = false;

  formData = {
    minPrice: 50000,
    maxPrice: 500000
  };

  constructor() {
    this.iconService.addIcon(DollarOutline, SaveOutline);
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
        this.formData = {
          minPrice: settings.minPrice,
          maxPrice: settings.maxPrice
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading settings:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải cấu hình. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi tải cấu hình');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    if (this.formData.minPrice >= this.formData.maxPrice) {
      this.error = 'Giá sàn phải nhỏ hơn giá trần.';
      this.toastService.error('Giá sàn phải nhỏ hơn giá trần.', 'Lỗi validation');
      return;
    }

    if (this.formData.minPrice < 0 || this.formData.maxPrice < 0) {
      this.error = 'Giá không được âm.';
      this.toastService.error('Giá không được âm.', 'Lỗi validation');
      return;
    }

    this.isSaving = true;
    this.error = '';

    const request = {
      minPrice: this.formData.minPrice,
      maxPrice: this.formData.maxPrice,
      paymentMethods: this.settings?.paymentMethods || []
    };

    this.systemSettingsService.updateSettings(request).subscribe({
      next: (settings) => {
        this.settings = settings;
        this.isSaving = false;
        this.cdr.detectChanges();
        this.toastService.success('Lưu cấu hình thành công!', 'Thành công');
      },
      error: (err) => {
        console.error('Error saving settings:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể lưu cấu hình. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi lưu cấu hình');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }
}



