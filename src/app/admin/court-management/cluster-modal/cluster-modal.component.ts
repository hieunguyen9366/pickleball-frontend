import { Component, inject, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourtService } from 'src/app/player/services/court.service';
import { CourtGroup } from 'src/app/player/models/court.model';
import { UserService } from 'src/app/player/services/user.service';
import { User, UserRole } from 'src/app/player/models/user.model';
import { ApiService } from 'src/app/common/api.service';
import { ToastService } from 'src/app/common/services/toast.service';

@Component({
    selector: 'app-cluster-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './cluster-modal.component.html',
    styleUrls: ['./cluster-modal.component.scss']
})
export class ClusterModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private fb = inject(FormBuilder);
    private courtService = inject(CourtService);
    private userService = inject(UserService);
    private apiService = inject(ApiService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    managers: User[] = [];

    @Input() cluster?: CourtGroup; // If present, edit mode

    form!: FormGroup;
    isLoading = false;
    error = '';

    ngOnInit(): void {
        this.loadManagers();
        // Initialize form with cluster data if editing
        const initialData = this.cluster ? {
            courtGroupName: this.cluster.courtGroupName || '',
            address: this.cluster.address || '',
            district: this.cluster.district || '',
            city: this.cluster.city || '',
            description: this.cluster.description || '',
            managerId: this.cluster.managerId || null
        } : {
            courtGroupName: '',
            address: '',
            district: '',
            city: '',
            description: '',
            managerId: null
        };

        this.form = this.fb.group({
            courtGroupName: [initialData.courtGroupName, [Validators.required, Validators.maxLength(100)]],
            address: [initialData.address, [Validators.required, Validators.maxLength(255)]],
            district: [initialData.district, [Validators.required, Validators.maxLength(100)]],
            city: [initialData.city, [Validators.required, Validators.maxLength(100)]],
            description: [initialData.description],
            managerId: [initialData.managerId]
        });
    }

    loadManagers() {
        this.userService.getUsersByRole(UserRole.COURT_MANAGER).subscribe({
            next: (users) => {
                this.managers = users;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load managers', err);
                // Don't block form if managers fail to load
            }
        });
    }

    save(): void {
        if (this.form.invalid) {
            // Mark all fields as touched to show validation errors
            Object.keys(this.form.controls).forEach(key => {
                this.form.get(key)?.markAsTouched();
            });
            return;
        }

        this.isLoading = true;
        this.error = ''; // Clear previous errors
        const value = this.form.value;

        // Validate required fields
        if (!value.courtGroupName || value.courtGroupName.trim() === '') {
            this.error = 'Tên cụm sân là bắt buộc.';
            this.isLoading = false;
            return;
        }

        if (this.cluster) {
            // Update
            const updated: CourtGroup = { 
                ...this.cluster, 
                courtGroupName: value.courtGroupName,
                address: value.address,
                district: value.district,
                city: value.city,
                description: value.description || '',
                managerId: value.managerId || undefined
            };
            this.courtService.updateCourtGroup(this.cluster.courtGroupId, updated).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges(); // Update UI first
                    // Show toast and close modal
                    this.toastService.success('Cập nhật cụm sân thành công!', 'Thành công');
                    // Use setTimeout to ensure toast is rendered before closing modal
                    setTimeout(() => {
                        this.activeModal.close('saved');
                    }, 300);
                },
                error: (err) => {
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể cập nhật cụm sân. Vui lòng thử lại sau.';
                    this.error = errorMsg;
                    this.toastService.error(errorMsg, 'Lỗi cập nhật');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            // Create
            const newGroup: CourtGroup = {
                courtGroupId: 0, // Will be set by backend
                courtGroupName: value.courtGroupName,
                address: value.address,
                district: value.district,
                city: value.city,
                description: value.description || '',
                managerId: value.managerId || undefined
            };
            this.courtService.createCourtGroup(newGroup).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges(); // Update UI first
                    // Show toast and close modal
                    this.toastService.success('Tạo cụm sân thành công!', 'Thành công');
                    // Use setTimeout to ensure toast is rendered before closing modal
                    setTimeout(() => {
                        this.activeModal.close('saved');
                    }, 300);
                },
                error: (err) => {
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tạo cụm sân. Vui lòng thử lại sau.';
                    this.error = errorMsg;
                    this.toastService.error(errorMsg, 'Lỗi tạo mới');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    close(): void {
        this.activeModal.dismiss();
    }
}
