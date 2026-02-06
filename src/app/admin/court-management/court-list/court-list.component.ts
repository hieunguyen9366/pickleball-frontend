import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourtService } from 'src/app/player/services/court.service';
import { Court, CourtStatus } from 'src/app/player/models/court.model';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CourtModalComponent } from '../court-modal/court-modal.component';
import { IconDirective, IconService } from '@ant-design/icons-angular';
import { EditOutline, DeleteOutline, PlusOutline, MoreOutline } from '@ant-design/icons-angular/icons';
import { ApiService } from 'src/app/common/api.service';
import { ToastService } from 'src/app/common/services/toast.service';

@Component({
    selector: 'app-court-list',
    standalone: true,
    imports: [CommonModule, CardComponent, IconDirective],
    templateUrl: './court-list.component.html',
    styleUrls: ['./court-list.component.scss']
})
export class CourtListComponent implements OnInit {
    private courtService = inject(CourtService);
    private modalService = inject(NgbModal);
    private iconService = inject(IconService);
    private apiService = inject(ApiService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    courts: Court[] = [];
    /**
     * Cache primary image data URL per courtId to avoid reloading on every change detection.
     */
    courtImageCache: { [courtId: number]: string } = {};
    isLoading = false;
    error = '';

    constructor() {
        this.iconService.addIcon(EditOutline, DeleteOutline, PlusOutline, MoreOutline);
    }

    ngOnInit(): void {
        this.loadCourts();
    }

    loadCourts(): void {
        this.isLoading = true;
        this.error = '';
        this.courtService.searchCourts({ pageSize: 100 }).subscribe({ // Fetch all for now
            next: (response) => {
                this.courts = response.courts || [];
                // Prefetch primary images for courts that have image IDs
                this.prefetchCourtImages();
                this.isLoading = false;
                this.error = '';
                this.cdr.detectChanges(); // Trigger change detection
            },
            error: (err) => {
                console.error('Failed to load courts', err);
                const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tải danh sách sân. Vui lòng thử lại sau.';
                this.error = errorMsg;
                this.toastService.error(errorMsg, 'Lỗi tải dữ liệu');
                this.courts = [];
                this.isLoading = false;
                this.cdr.detectChanges(); // Trigger change detection
            }
        });
    }

    openModal(court?: Court): void {
        const modalRef = this.modalService.open(CourtModalComponent, {
            size: 'lg',
            centered: true
        });
        modalRef.componentInstance.court = court;

        modalRef.result.then((result) => {
            if (result === 'saved') {
                // Reload list after successful save
                setTimeout(() => {
                    this.loadCourts();
                }, 100);
            }
        }).catch(() => {
            // Modal dismissed, do nothing
        });
    }

    deleteCourt(id: number): void {
        if (confirm('Bạn có chắc chắn muốn xóa sân này không?')) {
            this.isLoading = true;
            this.error = '';
            this.cdr.detectChanges(); // Update UI to show loading state

            this.courtService.deleteCourt(id).subscribe({
                next: () => {
                    this.toastService.success('Xóa sân thành công!', 'Thành công');
                    // Reload list after successful delete
                    this.loadCourts();
                },
                error: (err) => {
                    console.error('Failed to delete court', err);
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể xóa sân. Vui lòng thử lại sau.';
                    this.toastService.error(errorMsg, 'Lỗi xóa');
                    this.isLoading = false;
                    this.cdr.detectChanges(); // Update UI
                }
            });
        }
    }

    getStatusClass(status: CourtStatus): string {
        switch (status) {
            case CourtStatus.AVAILABLE: return 'badge bg-light-success text-success';
            case CourtStatus.MAINTENANCE: return 'badge bg-light-warning text-warning';
            case CourtStatus.INACTIVE: return 'badge bg-light-danger text-danger';
            default: return 'badge bg-light-secondary text-secondary';
        }
    }

    getCourtImage(court: Court): string {
        // Prefer cached primary image loaded from image API
        const cached = this.courtImageCache[court.courtId];
        if (cached) {
            return cached;
        }

        // Fallback: use legacy images field if available (e.g. seeded URLs)
        if (court.images && court.images.length > 0) {
            return court.images[0];
        }

        // Default placeholder image
        return 'assets/images/index.jpg';
    }

    private prefetchCourtImages(): void {
        this.courts.forEach(court => {
            if (court.courtImageIds && court.courtImageIds.length > 0) {
                this.courtService.getCourtImages(court.courtId).subscribe({
                    next: (images) => {
                        if (images && images.length > 0) {
                            const img = images[0];
                            this.courtImageCache[court.courtId] = `data:${img.contentType};base64,${img.data}`;
                            this.cdr.detectChanges();
                        }
                    },
                    error: (err) => {
                        console.error('Failed to load court images', err);
                        // Không chặn UI nếu ảnh lỗi
                    }
                });
            }
        });
    }

    getLocation(court: Court): string {
        if (court.district) {
            return court.district;
        }
        if (court.city) {
            return court.city;
        }
        if (court.location) {
            return court.location;
        }
        return 'N/A';
    }

    getRating(court: Court): number {
        return court.rating || 5; // Default to 5 stars if no rating
    }

    showOptionsMenu: { [key: number]: boolean } = {};

    toggleOptionsMenu(courtId: number, event: Event): void {
        event.stopPropagation();
        this.showOptionsMenu[courtId] = !this.showOptionsMenu[courtId];
        // Close other menus
        Object.keys(this.showOptionsMenu).forEach(id => {
            if (+id !== courtId) {
                this.showOptionsMenu[+id] = false;
            }
        });
    }

    closeOptionsMenu(): void {
        Object.keys(this.showOptionsMenu).forEach(id => {
            this.showOptionsMenu[+id] = false;
        });
    }
}
