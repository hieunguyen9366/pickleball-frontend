import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourtService } from 'src/app/player/services/court.service';
import { CourtGroup } from 'src/app/player/models/court.model';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClusterModalComponent } from '../cluster-modal/cluster-modal.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { EditOutline, DeleteOutline, PlusOutline } from '@ant-design/icons-angular/icons';
import { ApiService } from 'src/app/common/api.service';
import { ToastService } from 'src/app/common/services/toast.service';

@Component({
    selector: 'app-cluster-list',
    standalone: true,
    imports: [CommonModule, CardComponent, IconDirective],
    templateUrl: './cluster-list.component.html',
    styleUrls: ['./cluster-list.component.scss']
})
export class ClusterListComponent implements OnInit {
    private courtService = inject(CourtService);
    private modalService = inject(NgbModal);
    private iconService = inject(IconService);
    private apiService = inject(ApiService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    clusters: CourtGroup[] = [];
    isLoading = false;
    error = '';

    // TODO: Replace with actual AuthService
    // Mock User Context: Change role to 'MANAGER' and id to 2 to test Manager view
    currentUser = { id: 1, role: 'ADMIN' };
    // currentUser = { id: 2, role: 'MANAGER' };

    constructor() {
        this.iconService.addIcon(EditOutline, DeleteOutline, PlusOutline);
    }

    ngOnInit(): void {
        this.loadClusters();
    }

    loadClusters(): void {
        this.isLoading = true;
        let managerId: number | undefined;

        // If User is a Manager, only show their items
        if (this.currentUser.role === 'MANAGER') {
            managerId = this.currentUser.id;
        }

        this.courtService.getCourtGroups(managerId).subscribe({
            next: (data) => {
                this.clusters = data || [];
                this.isLoading = false;
                this.error = '';
                // Trigger change detection to update UI
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load clusters', err);
                const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải danh sách cụm sân. Vui lòng thử lại sau.';
                this.error = errorMsg;
                this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
                this.clusters = [];
                this.isLoading = false;
                // Trigger change detection to update UI
                this.cdr.detectChanges();
            }
        });
    }

    openModal(cluster?: CourtGroup): void {
        const modalRef = this.modalService.open(ClusterModalComponent, { 
            centered: true,
            size: 'lg'
        });
        modalRef.componentInstance.cluster = cluster; // Pass data if editing

        modalRef.result.then((result) => {
            if (result === 'saved') {
                // Reload list after successful save
                // Use setTimeout to ensure modal is fully closed before reloading
                setTimeout(() => {
                    this.loadClusters();
                }, 100);
            }
        }).catch(() => { 
            // Modal dismissed, do nothing
        });
    }

    deleteCluster(id: number): void {
        if (confirm('Bạn có chắc chắn muốn xóa cụm sân này không?')) {
            this.isLoading = true;
            this.error = '';
            this.cdr.detectChanges(); // Update UI to show loading state
            
            this.courtService.deleteCourtGroup(id).subscribe({
                next: () => {
                    // Show toast first
                    this.toastService.success('Xóa cụm sân thành công!', 'Thành công');
                    // Reload list after successful delete
                    this.loadClusters();
                },
                error: (err) => {
                    console.error('Failed to delete cluster', err);
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể xóa cụm sân. Vui lòng thử lại sau.';
                    this.toastService.error(errorMsg, 'Lỗi xóa');
                    this.isLoading = false;
                    this.cdr.detectChanges(); // Update UI
                }
            });
        }
    }
}
