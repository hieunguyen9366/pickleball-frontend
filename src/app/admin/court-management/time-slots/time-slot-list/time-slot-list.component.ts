import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { EditOutline, DeleteOutline, PlusOutline, ClockCircleOutline } from '@ant-design/icons-angular/icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TimeSlotService } from '../../../services/time-slot.service';
import { TimeSlotConfig } from '../../../models/time-slot.model';
import { TimeSlotModalComponent } from '../time-slot-modal/time-slot-modal.component';
import { CourtService } from '../../../../player/services/court.service';
import { Court, CourtGroup } from '../../../../player/models/court.model';
import { ApiService } from '../../../../common/api.service';
import { ToastService } from '../../../../common/services/toast.service';
import { AuthService } from '../../../../player/services/auth.service';
import { UserRole } from '../../../../player/models/user.model';

@Component({
  selector: 'app-time-slot-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, IconDirective],
  templateUrl: './time-slot-list.component.html',
  styleUrls: ['./time-slot-list.component.scss']
})
export class TimeSlotListComponent implements OnInit {
  private timeSlotService = inject(TimeSlotService);
  private courtService = inject(CourtService);
  private modalService = inject(NgbModal);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  configs: TimeSlotConfig[] = [];
  courts: Court[] = [];
  courtGroups: CourtGroup[] = [];
  isLoading = false;
  error = '';

  // Filter
  selectedCourtId?: number;
  selectedCourtGroupId?: number;

  constructor() {
    this.iconService.addIcon(EditOutline, DeleteOutline, PlusOutline, ClockCircleOutline);
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = '';

    const currentUser = this.authService.getCurrentUser();
    const isManager = currentUser?.role === UserRole.COURT_MANAGER;
    const managerId = isManager ? currentUser?.userId : undefined;

    // Load courts and court groups first
    this.courtService.getCourtGroups(managerId).subscribe({
      next: (groups) => {
        this.courtGroups = groups;
        // Load courts
        this.courtService.searchCourts({ page: 1, pageSize: 100 }).subscribe({
          next: (response) => {
            this.courts = response.courts;
            // Load time slot configs
            this.loadTimeSlotConfigs();
          },
          error: (err) => {
            console.error('Error loading courts:', err);
            const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải danh sách sân. Vui lòng thử lại sau.';
            this.error = errorMsg;
            this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error loading court groups:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải danh sách cụm sân. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTimeSlotConfigs(): void {
    this.timeSlotService.getTimeSlotConfigs(this.selectedCourtId, this.selectedCourtGroupId).subscribe({
      next: (response) => {
        this.configs = response.configs || [];
        this.isLoading = false;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading time slot configs:', err);
        const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải cấu hình khung giờ. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
        this.configs = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openModal(config?: TimeSlotConfig): void {
    const modalRef = this.modalService.open(TimeSlotModalComponent, {
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.config = config;
    modalRef.componentInstance.courts = this.courts;
    modalRef.componentInstance.courtGroups = this.courtGroups;
    modalRef.result.then((result) => {
      if (result === 'saved') {
        // Reload list after successful save
        setTimeout(() => {
          this.loadTimeSlotConfigs();
        }, 100);
      }
    }).catch(() => {
      // Modal dismissed, do nothing
    });
  }

  deleteConfig(configId: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa cấu hình khung giờ này không?')) {
      this.isLoading = true;
      this.error = '';
      this.cdr.detectChanges(); // Update UI to show loading state

      this.timeSlotService.deleteTimeSlotConfig(configId).subscribe({
        next: () => {
          this.toastService.success('Xóa cấu hình khung giờ thành công!', 'Thành công');
          // Reload list after successful delete
          this.loadTimeSlotConfigs();
        },
        error: (err) => {
          console.error('Error deleting config:', err);
          const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể xóa cấu hình. Vui lòng thử lại sau.';
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

  getCourtGroupName(courtGroupId?: number): string {
    if (!courtGroupId) return 'N/A';
    const group = this.courtGroups.find(g => g.courtGroupId === courtGroupId);
    return group?.courtGroupName || 'N/A';
  }

  onFilterChange(): void {
    this.loadTimeSlotConfigs();
  }
}

