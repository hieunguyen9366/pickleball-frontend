import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { PlusOutline, DeleteOutline, DollarOutline, EditOutline } from '@ant-design/icons-angular/icons';
import { DynamicPricingService } from '../../../services/dynamic-pricing.service';
import { DynamicPricingConfig, DynamicPricingConfigRequest, DAYS_OF_WEEK, DayOfWeek } from '../../../models/dynamic-pricing.model';
import { CourtService } from '../../../../player/services/court.service';
import { Court } from '../../../../player/models/court.model';
import { ApiService } from '../../../../common/api.service';
import { ToastService } from '../../../../common/services/toast.service';
import { AuthService } from '../../../../player/services/auth.service';

@Component({
  selector: 'app-dynamic-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardComponent, IconDirective],
  templateUrl: './dynamic-pricing.component.html',
  styleUrls: ['./dynamic-pricing.component.scss']
})
export class DynamicPricingComponent implements OnInit {
  private dynamicPricingService = inject(DynamicPricingService);
  private courtService = inject(CourtService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  configs: DynamicPricingConfig[] = [];
  courts: Court[] = [];
  isLoading = false;
  error = '';

  // Filter - Only court selection (backend doesn't support court group)
  selectedCourtId?: number;

  // Form for creating/editing
  pricingForm!: FormGroup;
  isEditing = false;
  editingConfigId?: number;

  // Days of week
  DAYS_OF_WEEK = DAYS_OF_WEEK;

  // Current user
  currentUser = this.authService.getCurrentUser();

  constructor() {
    this.iconService.addIcon(PlusOutline, DeleteOutline, DollarOutline, EditOutline);
    this.initForm();
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.loadCourts();
  }

  initForm(): void {
    this.pricingForm = this.fb.group({
      courtId: [this.selectedCourtId, Validators.required],
      timeStart: ['17:00', Validators.required],
      timeEnd: ['21:00', Validators.required],
      daysOfWeek: [['MON', 'TUE', 'WED', 'THU', 'FRI'], Validators.required],
      priceModifier: [1.2, [Validators.required, Validators.min(0.1)]],
      isHoliday: [false]
    });
  }

  loadCourts(): void {
    this.isLoading = true;
    this.error = '';

    this.courtService.searchCourts({ page: 1, pageSize: 100 }).subscribe({
      next: (response) => {
        this.courts = response.courts;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading courts:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải danh sách sân.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPricingConfigs(): void {
    if (!this.selectedCourtId) {
      this.configs = [];
      return;
    }

    this.isLoading = true;
    this.dynamicPricingService.getPricingConfigsForCourt(this.selectedCourtId).subscribe({
      next: (configs) => {
        this.configs = configs || [];
        this.isLoading = false;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading pricing configs:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải cấu hình giá.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
        this.configs = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  startEdit(config: DynamicPricingConfig): void {
    this.isEditing = true;
    this.editingConfigId = config.configId;

    // Parse days of week
    const days = config.daysOfWeek.split(',').filter(d => d.trim());

    this.pricingForm.patchValue({
      courtId: config.courtId,
      timeStart: config.timeStart,
      timeEnd: config.timeEnd,
      daysOfWeek: days,
      priceModifier: config.priceModifier,
      isHoliday: config.isHoliday
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingConfigId = undefined;
    this.initForm();
  }

  save(): void {
    if (this.pricingForm.invalid) {
      Object.keys(this.pricingForm.controls).forEach(key => {
        this.pricingForm.get(key)?.markAsTouched();
      });
      this.error = 'Vui lòng điền đầy đủ thông tin.';
      return;
    }

    const formValue = this.pricingForm.value;

    if (!formValue.courtId) {
      this.error = 'Vui lòng chọn sân.';
      return;
    }

    if (!formValue.daysOfWeek || formValue.daysOfWeek.length === 0) {
      this.error = 'Vui lòng chọn ít nhất một ngày trong tuần.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    const request: DynamicPricingConfigRequest = {
      timeStart: formValue.timeStart,
      timeEnd: formValue.timeEnd,
      daysOfWeek: formValue.daysOfWeek.join(','),
      priceModifier: formValue.priceModifier,
      isHoliday: formValue.isHoliday
    };

    if (this.isEditing && this.editingConfigId) {
      this.dynamicPricingService.updatePricingConfig(formValue.courtId, this.editingConfigId, request).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.toastService.success('Cập nhật cấu hình giá thành công!', 'Thành công');
          this.cancelEdit();
          setTimeout(() => {
            this.loadPricingConfigs();
          }, 100);
        },
        error: (err) => {
          console.error('Error updating config:', err);
          const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể cập nhật cấu hình.';
          this.error = errorMsg;
          this.toastService.error(errorMsg, 'Lỗi cập nhật');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.dynamicPricingService.createPricingConfig(formValue.courtId, request).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.toastService.success('Tạo cấu hình giá thành công!', 'Thành công');
          this.cancelEdit();
          setTimeout(() => {
            this.loadPricingConfigs();
          }, 100);
        },
        error: (err) => {
          console.error('Error creating config:', err);
          const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tạo cấu hình.';
          this.error = errorMsg;
          this.toastService.error(errorMsg, 'Lỗi tạo mới');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteConfig(courtId: number, configId: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa cấu hình giá này không?')) {
      this.isLoading = true;
      this.error = '';
      this.cdr.detectChanges();

      this.dynamicPricingService.deletePricingConfig(courtId, configId).subscribe({
        next: () => {
          this.toastService.success('Xóa cấu hình giá thành công!', 'Thành công');
          this.loadPricingConfigs();
        },
        error: (err) => {
          console.error('Error deleting config:', err);
          const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể xóa cấu hình.';
          this.toastService.error(errorMsg, 'Lỗi xóa');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  getCourtName(courtId?: number): string {
    if (!courtId) return 'N/A';
    const court = this.courts.find(c => c.courtId === courtId);
    return court?.courtName || 'N/A';
  }

  onFilterChange(): void {
    this.loadPricingConfigs();
  }

  isDaySelected(day: DayOfWeek): boolean {
    const selected = this.pricingForm.get('daysOfWeek')?.value || [];
    return selected.includes(day);
  }

  toggleDay(day: DayOfWeek): void {
    const control = this.pricingForm.get('daysOfWeek');
    const selected = control?.value || [];
    const index = selected.indexOf(day);

    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      selected.push(day);
    }

    control?.setValue([...selected]);
  }

  formatDaysOfWeek(daysStr: string): string {
    const days = daysStr.split(',').filter(d => d.trim());
    return days.map(d => {
      const day = DAYS_OF_WEEK.find(dow => dow.value === d.trim());
      return day?.label || d;
    }).join(', ');
  }

  getPriceModifierClass(modifier: number): string {
    if (modifier > 1.0) return 'badge bg-warning';
    if (modifier < 1.0) return 'badge bg-info';
    return 'badge bg-secondary';
  }
}
