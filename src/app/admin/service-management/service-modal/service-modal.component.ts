import { Component, inject, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceService } from 'src/app/player/services/service.service';
import { CourtService } from 'src/app/player/services/court.service';
import { Service, ServiceStatus } from 'src/app/player/models/service.model';
import { CourtGroup } from 'src/app/player/models/court.model';
import { ApiService } from 'src/app/common/api.service';
import { ToastService } from 'src/app/common/services/toast.service';

@Component({
    selector: 'app-service-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './service-modal.component.html',
    styleUrls: ['./service-modal.component.scss']
})
export class ServiceModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private fb = inject(FormBuilder);
    private serviceService = inject(ServiceService);
    private courtService = inject(CourtService);
    private apiService = inject(ApiService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    @Input() service?: Service;

    form!: FormGroup;
    isLoading = false;
    error = '';
    courtGroups: CourtGroup[] = [];

    serviceStatuses = Object.values(ServiceStatus);

    ngOnInit(): void {
        this.loadCourtGroups();
        
        this.form = this.fb.group({
            serviceName: [this.service?.serviceName || '', Validators.required],
            description: [this.service?.description || ''],
            price: [this.service?.price || 10000, [Validators.required, Validators.min(0)]],
            unit: [this.service?.unit || 'cái', Validators.required],
            status: [this.service?.status || ServiceStatus.AVAILABLE, Validators.required],
            courtGroupId: [this.service?.courtGroupId || null, Validators.required]
        });
    }

    loadCourtGroups(): void {
        this.courtService.getCourtGroups().subscribe({
            next: (groups) => {
                this.courtGroups = groups || [];
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load court groups', err);
                // Don't block form if groups fail to load
            }
        });
    }

    save(): void {
        if (this.form.invalid) {
            // Mark all fields as touched to show validation errors
            Object.keys(this.form.controls).forEach(key => {
                this.form.get(key)?.markAsTouched();
            });
            this.error = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
            return;
        }

        this.isLoading = true;
        this.error = '';
        const value = this.form.value;

        // Validate required fields
        if (!value.serviceName || value.serviceName.trim() === '') {
            this.error = 'Tên dịch vụ là bắt buộc.';
            this.isLoading = false;
            return;
        }

        if (!value.courtGroupId) {
            this.error = 'Cụm sân là bắt buộc.';
            this.isLoading = false;
            return;
        }

        if (this.service) {
            const updated = { ...this.service, ...value };
            this.serviceService.updateService(this.service.serviceId, updated).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.toastService.success('Cập nhật dịch vụ thành công!', 'Thành công');
                    setTimeout(() => {
                        this.activeModal.close('saved');
                    }, 300);
                },
                error: (err) => {
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể cập nhật dịch vụ. Vui lòng thử lại sau.';
                    this.error = errorMsg;
                    this.toastService.error(errorMsg, 'Lỗi cập nhật');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.serviceService.createService(value as Service).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this.toastService.success('Tạo dịch vụ thành công!', 'Thành công');
                    setTimeout(() => {
                        this.activeModal.close('saved');
                    }, 300);
                },
                error: (err) => {
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tạo dịch vụ. Vui lòng thử lại sau.';
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
