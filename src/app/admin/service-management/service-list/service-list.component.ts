import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceService } from 'src/app/player/services/service.service';
import { Service, ServiceStatus, ServiceListRequest } from 'src/app/player/models/service.model';
import { CourtService } from 'src/app/player/services/court.service';
import { CourtGroup } from 'src/app/player/models/court.model';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ServiceModalComponent } from '../service-modal/service-modal.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { EditOutline, DeleteOutline, PlusOutline } from '@ant-design/icons-angular/icons';
import { ApiService } from 'src/app/common/api.service';
import { ToastService } from 'src/app/common/services/toast.service';

@Component({
    selector: 'app-service-list',
    standalone: true,
    imports: [CommonModule, FormsModule, CardComponent, IconDirective],
    templateUrl: './service-list.component.html',
    styleUrls: ['./service-list.component.scss']
})
export class ServiceListComponent implements OnInit {
    private serviceService = inject(ServiceService);
    private courtService = inject(CourtService);
    private modalService = inject(NgbModal);
    private iconService = inject(IconService);
    private apiService = inject(ApiService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    services: Service[] = [];
    courtGroups: CourtGroup[] = [];
    selectedCourtGroupId?: number = -1;
    isLoading = false;
    error = '';

    constructor() {
        this.iconService.addIcon(EditOutline, DeleteOutline, PlusOutline);
    }

    ngOnInit(): void {
        this.loadCourtGroups();
        this.loadServices();
    }

    loadCourtGroups(): void {
        this.courtService.getCourtGroups().subscribe({
            next: (groups) => {
                this.courtGroups = groups;
            },
            error: (err) => {
                console.error('Failed to load court groups', err);
                // Error loading court groups is not critical, continue
            }
        });
    }

    onCourtGroupChange(): void {
        this.loadServices();
    }

    loadServices(): void {
        this.isLoading = true;
        const request: ServiceListRequest = {
            courtGroupId: (this.selectedCourtGroupId?.toString() == '-1' || this.selectedCourtGroupId == undefined) ? undefined : this.selectedCourtGroupId
        };

        this.serviceService.getServices(request).subscribe({
            next: (data) => {
                this.services = data || [];
                this.isLoading = false;
                this.error = '';
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load services', err);
                const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.';
                this.error = errorMsg;
                this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
                this.services = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    openModal(service?: Service): void {
        const modalRef = this.modalService.open(ServiceModalComponent, {
            centered: true,
            size: 'lg'
        });
        modalRef.componentInstance.service = service;

        modalRef.result.then((result) => {
            if (result === 'saved') {
                setTimeout(() => {
                    this.loadServices();
                }, 100);
            }
        }).catch(() => {
            // Modal dismissed, do nothing
        });
    }

    deleteService(id: number): void {
        if (confirm('Bạn có chắc chắn muốn xóa dịch vụ này không?')) {
            this.isLoading = true;
            this.error = '';
            this.cdr.detectChanges();

            this.serviceService.deleteService(id).subscribe({
                next: () => {
                    this.toastService.success('Xóa dịch vụ thành công!', 'Thành công');
                    this.loadServices();
                },
                error: (err) => {
                    console.error('Failed to delete service', err);
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể xóa dịch vụ. Vui lòng thử lại sau.';
                    this.toastService.error(errorMsg, 'Lỗi xóa');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    getStatusClass(status: ServiceStatus): string {
        switch (status) {
            case ServiceStatus.AVAILABLE: return 'badge bg-light-success text-success';
            case ServiceStatus.UNAVAILABLE: return 'badge bg-light-danger text-danger';
            default: return 'badge bg-light-secondary text-secondary';
        }
    }
}
