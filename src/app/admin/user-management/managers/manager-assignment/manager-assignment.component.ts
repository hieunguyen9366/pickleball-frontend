import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { CheckOutline, CloseOutline, SaveOutline, EnvironmentOutline } from '@ant-design/icons-angular/icons';
import { PermissionService } from '../../../services/permission.service';
import { UserService } from '../../../../player/services/user.service';
import { ToastService } from '../../../../common/services/toast.service';
import { ManagerCourtGroupsResponse } from '../../../models/permission.model';
import { CourtGroup } from '../../../../player/models/court.model';
import { ApiService } from '../../../../common/api.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-manager-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, IconDirective],
  templateUrl: './manager-assignment.component.html',
  styleUrls: ['./manager-assignment.component.scss']
})
export class ManagerAssignmentComponent implements OnInit {
  private permissionService = inject(PermissionService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private iconService = inject(IconService);
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);

  managerId!: number;

  data: ManagerCourtGroupsResponse | null = null;
  managerInfo: any = null; // Store full user details
  isLoading = false;
  error = '';
  selectedGroupIds: number[] = [];

  constructor() {
    this.iconService.addIcon(CheckOutline, CloseOutline, SaveOutline, EnvironmentOutline);
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.managerId = +id;
      this.loadData();
    } else {
      this.error = 'Không tìm thấy ID quản lý.';
    }
  }

  loadData(): void {
    this.isLoading = true;
    this.error = '';

    this.permissionService.getManagerCourtGroups(this.managerId).subscribe({
      next: (response) => {
        this.data = response;
        // Khởi tạo selectedGroupIds với các cụm sân đã được gán
        this.selectedGroupIds = response.assignedCourtGroups.map(g => g.courtGroupId);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading manager assignment:', err);
        // Sử dụng ApiService.extractErrorMessage() để thống nhất
        this.error = this.apiService.extractErrorMessage(err) ||
          'Không thể tải thông tin phân quyền. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleGroupSelection(groupId: number): void {
    const index = this.selectedGroupIds.indexOf(groupId);
    if (index > -1) {
      this.selectedGroupIds.splice(index, 1);
    } else {
      this.selectedGroupIds.push(groupId);
    }
  }

  isGroupSelected(groupId: number): boolean {
    return this.selectedGroupIds.includes(groupId);
  }

  save(): void {
    if (!this.managerId) return;

    this.isLoading = true;
    this.error = '';

    this.permissionService.assignCourtGroups({
      managerId: this.managerId,
      courtGroupIds: this.selectedGroupIds
    }).subscribe({
      next: () => {
        this.toastService.success('Cập nhật phân quyền thành công');
        // Reload data
        this.loadData();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error saving assignment:', err);
        // Sử dụng ApiService.extractErrorMessage() để thống nhất
        const errorMsg = this.apiService.extractErrorMessage(err) ||
          'Không thể lưu phân quyền. Vui lòng thử lại sau.';
        this.error = errorMsg;
        this.toastService.error(errorMsg);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/user-management/managers']);
  }
}



