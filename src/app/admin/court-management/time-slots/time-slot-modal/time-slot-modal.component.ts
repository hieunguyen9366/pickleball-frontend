import { Component, Input, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TimeSlotConfig, TimeSlotConfigRequest } from '../../../models/time-slot.model';
import { TimeSlotService } from '../../../services/time-slot.service';
import { Court, CourtGroup } from '../../../../player/models/court.model';
import { ApiService } from '../../../../common/api.service';
import { ToastService } from '../../../../common/services/toast.service';

@Component({
  selector: 'app-time-slot-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './time-slot-modal.component.html',
  styleUrls: ['./time-slot-modal.component.scss']
})
export class TimeSlotModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private timeSlotService = inject(TimeSlotService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  @Input() config?: TimeSlotConfig;
  @Input() courts: Court[] = [];
  @Input() courtGroups: CourtGroup[] = [];

  formData: TimeSlotConfigRequest = {
    courtId: undefined,
    courtGroupId: undefined,
    openTime: '05:00',
    closeTime: '23:00',
    slotDuration: 60,
    isActive: true
  };

  slotDurationOptions = [30, 60];
  isLoading = false;
  error = '';

  ngOnInit(): void {
    if (this.config) {
      this.formData = {
        courtId: this.config.courtId,
        courtGroupId: this.config.courtGroupId,
        openTime: this.config.openTime,
        closeTime: this.config.closeTime,
        slotDuration: this.config.slotDuration,
        isActive: this.config.isActive
      };
    }
  }

  save(): void {
    // Validation
    if (!this.formData.openTime || !this.formData.closeTime) {
      this.error = 'Vui lòng nhập đầy đủ giờ mở cửa và đóng cửa.';
      return;
    }

    if (this.formData.slotDuration !== 30 && this.formData.slotDuration !== 60) {
      this.error = 'Độ dài slot phải là 30 hoặc 60 phút.';
      return;
    }

    if (!this.formData.courtId && !this.formData.courtGroupId) {
      this.error = 'Vui lòng chọn sân hoặc cụm sân.';
      return;
    }

    if (this.formData.courtId && this.formData.courtGroupId) {
      this.error = 'Chỉ được chọn một trong hai: sân hoặc cụm sân.';
      return;
    }

    // Validate time format and logic
    const openTime = this.parseTime(this.formData.openTime);
    const closeTime = this.parseTime(this.formData.closeTime);

    if (!openTime || !closeTime) {
      this.error = 'Giờ mở cửa và đóng cửa không hợp lệ.';
      return;
    }

    if (closeTime <= openTime) {
      this.error = 'Giờ đóng cửa phải sau giờ mở cửa.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    if (this.config && this.config.configId) {
      // Update
      this.timeSlotService.updateTimeSlotConfig(this.config.configId, this.formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.toastService.success('Cập nhật cấu hình khung giờ thành công!', 'Thành công');
          setTimeout(() => {
            this.activeModal.close('saved');
          }, 300);
        },
        error: (err) => {
          const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể cập nhật cấu hình. Vui lòng thử lại sau.';
          this.error = errorMsg;
          this.toastService.error(errorMsg, 'Lỗi cập nhật');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create
      this.timeSlotService.createTimeSlotConfig(this.formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.toastService.success('Tạo cấu hình khung giờ thành công!', 'Thành công');
          setTimeout(() => {
            this.activeModal.close('saved');
          }, 300);
        },
        error: (err) => {
          const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tạo cấu hình. Vui lòng thử lại sau.';
          this.error = errorMsg;
          this.toastService.error(errorMsg, 'Lỗi tạo mới');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private parseTime(timeStr: string): number | null {
    // Parse "HH:mm" format to minutes since midnight
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    return hours * 60 + minutes;
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  onCourtGroupChange(): void {
    // Khi chọn cụm sân, bỏ chọn sân cụ thể
    if (this.formData.courtGroupId) {
      this.formData.courtId = undefined;
    }
  }

  onCourtChange(): void {
    // Khi chọn sân cụ thể, bỏ chọn cụm sân
    if (this.formData.courtId) {
      this.formData.courtGroupId = undefined;
    }
  }

  getCourtName(courtId?: number): string {
    if (!courtId) return '';
    const court = this.courts.find(c => c.courtId === courtId);
    return court?.courtName || '';
  }

  getCourtGroupName(courtGroupId?: number): string {
    if (!courtGroupId) return '';
    const group = this.courtGroups.find(g => g.courtGroupId === courtGroupId);
    return group?.courtGroupName || '';
  }
}

