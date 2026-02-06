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

    selectedImageFiles: File[] = [];
    imagePreviewUrls: string[] = [];

    // Gallery
    courtImages: any[] = []; // CourtImageData

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

        if (this.cluster) {
            this.loadImages();
        }
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

    loadImages() {
        if (!this.cluster) return;
        this.courtService.getCourtGroupImages(this.cluster.courtGroupId).subscribe({
            next: (images) => {
                this.courtImages = images;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Failed to load images', err)
        });
    }

    deleteImage(imageId: number) {
        if (!confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;

        this.courtService.deleteCourtGroupImage(imageId).subscribe({
            next: () => {
                this.toastService.success('Đã xóa ảnh thành công');
                this.loadImages();
            },
            error: (err) => {
                this.toastService.error('Không thể xóa ảnh');
                console.error(err);
            }
        });
    }

    moveImage(index: number, direction: 'left' | 'right') {
        if (direction === 'left' && index > 0) {
            const temp = this.courtImages[index];
            this.courtImages[index] = this.courtImages[index - 1];
            this.courtImages[index - 1] = temp;
        } else if (direction === 'right' && index < this.courtImages.length - 1) {
            const temp = this.courtImages[index];
            this.courtImages[index] = this.courtImages[index + 1];
            this.courtImages[index + 1] = temp;
        } else {
            return;
        }

        // Save new order
        const imageIds = this.courtImages.map(img => img.imageId);
        if (this.cluster) {
            this.courtService.updateCourtGroupImageOrder(this.cluster.courtGroupId, imageIds).subscribe({
                next: () => {
                    // Order updated silently
                },
                error: (err) => console.error('Failed to update order', err)
            });
        }
        this.cdr.detectChanges();
    }

    onImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) {
            this.selectedImageFiles = [];
            this.imagePreviewUrls = [];
            return;
        }

        this.selectedImageFiles = Array.from(input.files);
        this.imagePreviewUrls = [];

        this.selectedImageFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreviewUrls.push(reader.result as string);
                this.cdr.detectChanges();
            };
            reader.readAsDataURL(file);
        });
    }

    // Quick upload button for existing cluster
    uploadImage() {
        if (!this.cluster || this.selectedImageFiles.length === 0) return;

        this.isLoading = true;
        this.courtService.uploadCourtGroupImages(this.cluster.courtGroupId, this.selectedImageFiles).subscribe({
            next: () => {
                this.isLoading = false;
                this.selectedImageFiles = [];
                this.imagePreviewUrls = [];
                this.toastService.success('Đã tải ảnh lên thành công');
                this.loadImages();

                // Reset file input
                const fileInput = document.getElementById('fileInput') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.toastService.error('Tải ảnh thất bại');
                console.error(err);
                this.cdr.detectChanges();
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
                    // Nếu có chọn ảnh mới và chưa upload
                    if (this.selectedImageFiles.length > 0 && !this.courtImages.length) {
                        this.courtService.uploadCourtGroupImages(this.cluster!.courtGroupId, this.selectedImageFiles).subscribe({
                            next: () => {
                                this.isLoading = false;
                                this.cdr.detectChanges();
                                this.toastService.success('Cập nhật cụm sân và ảnh thành công!', 'Thành công');
                                setTimeout(() => {
                                    this.activeModal.close('saved');
                                }, 300);
                            },
                            error: (err) => {
                                const errorMsg = this.apiService.extractErrorMessage(err) || 'Đã lưu thông tin cụm sân nhưng không thể lưu ảnh.';
                                this.error = errorMsg;
                                this.toastService.error(errorMsg, 'Lỗi lưu ảnh');
                                this.isLoading = false;
                                this.loadImages(); // Refresh list to be sure
                                this.cdr.detectChanges();
                            }
                        });
                    } else {
                        this.isLoading = false;
                        this.cdr.detectChanges(); // Update UI first
                        this.toastService.success('Cập nhật cụm sân thành công!', 'Thành công');
                        setTimeout(() => {
                            this.activeModal.close('saved');
                        }, 300);
                    }
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
                next: (created) => {
                    // Nếu có chọn ảnh thì upload sau khi tạo cụm sân
                    if (this.selectedImageFiles.length > 0 && created && created.courtGroupId) {
                        this.courtService.uploadCourtGroupImages(created.courtGroupId, this.selectedImageFiles).subscribe({
                            next: () => {
                                this.isLoading = false;
                                this.cdr.detectChanges();
                                this.toastService.success('Tạo cụm sân và ảnh thành công!', 'Thành công');
                                setTimeout(() => {
                                    this.activeModal.close('saved');
                                }, 300);
                            },
                            error: (err) => {
                                const errorMsg = this.apiService.extractErrorMessage(err) || 'Đã tạo cụm sân nhưng không thể lưu ảnh.';
                                this.error = errorMsg;
                                this.toastService.error(errorMsg, 'Lỗi lưu ảnh');
                                this.isLoading = false;
                                this.cdr.detectChanges();
                            }
                        });
                    } else {
                        this.isLoading = false;
                        this.cdr.detectChanges(); // Update UI first
                        this.toastService.success('Tạo cụm sân thành công!', 'Thành công');
                        setTimeout(() => {
                            this.activeModal.close('saved');
                        }, 300);
                    }
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
