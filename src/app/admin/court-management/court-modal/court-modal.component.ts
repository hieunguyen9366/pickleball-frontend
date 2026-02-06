import { Component, inject, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourtService } from 'src/app/player/services/court.service';
import { Court, CourtGroup, CourtStatus } from 'src/app/player/models/court.model';
import { ApiService } from 'src/app/common/api.service';
import { ToastService } from 'src/app/common/services/toast.service';

@Component({
    selector: 'app-court-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './court-modal.component.html',
    styleUrls: ['./court-modal.component.scss']
})
export class CourtModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private fb = inject(FormBuilder);
    private courtService = inject(CourtService);
    private apiService = inject(ApiService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    @Input() court?: Court;

    form!: FormGroup;
    isLoading = false;
    error = '';
    courtGroups: CourtGroup[] = [];

    courtStatuses = Object.values(CourtStatus);

    selectedImageFiles: File[] = [];
    imagePreviewUrls: string[] = [];

    // GalleryManager for Courts
    courtImages: any[] = [];

    ngOnInit(): void {
        // Load Court Groups for Dropdown
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

        // Initialize form with court data if editing
        const initialData = this.court ? {
            courtName: this.court.courtName || '',
            courtGroupId: this.court.courtGroupId || null,
            location: this.court.location || '',
            district: this.court.district || '',
            city: this.court.city || '',
            pricePerHour: this.court.pricePerHour || 120000,
            status: this.court.status || CourtStatus.AVAILABLE,
            description: this.court.description || '',
            images: this.court.images?.[0] || 'assets/images/index.jpg'
        } : {
            courtName: '',
            courtGroupId: null,
            location: '',
            district: '',
            city: '',
            pricePerHour: 120000,
            status: CourtStatus.AVAILABLE,
            description: '',
            images: 'assets/images/index.jpg'
        };

        this.form = this.fb.group({
            courtName: [initialData.courtName, [Validators.required, Validators.maxLength(50)]],
            courtGroupId: [initialData.courtGroupId, Validators.required],
            location: [initialData.location, Validators.required],
            district: [initialData.district, Validators.required],
            city: [initialData.city, Validators.required],
            pricePerHour: [initialData.pricePerHour, [Validators.required, Validators.min(0)]],
            status: [initialData.status, Validators.required],
            description: [initialData.description],
            images: [initialData.images]
        });

        // Auto-fill address details based on Cluster selection if creating new
        if (!this.court) {
            this.form.get('courtGroupId')?.valueChanges.subscribe(groupId => {
                const group = this.courtGroups.find(g => g.courtGroupId == groupId);
                if (group) {
                    this.form.patchValue({
                        location: group.address || '',
                        district: group.district || '',
                        city: group.city || ''
                    });
                    this.cdr.detectChanges();
                }
            });
        }

        if (this.court) {
            this.loadImages();
        }
    }

    loadImages() {
        if (!this.court) return;
        this.courtService.getCourtImages(this.court.courtId).subscribe({
            next: (images) => {
                this.courtImages = images;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Failed to load images', err)
        });
    }

    deleteImage(imageId: number) {
        if (!confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;

        this.courtService.deleteCourtImage(imageId).subscribe({
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
        if (this.court) {
            this.courtService.updateCourtImageOrder(this.court.courtId, imageIds).subscribe({
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

    // Quick upload button for existing court
    uploadImage() {
        if (!this.court || this.selectedImageFiles.length === 0) return;

        this.isLoading = true;
        this.courtService.uploadCourtImages(this.court.courtId, this.selectedImageFiles).subscribe({
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
        if (!value.courtName || value.courtName.trim() === '') {
            this.error = 'Tên sân là bắt buộc.';
            this.isLoading = false;
            return;
        }

        if (!value.courtGroupId) {
            this.error = 'Cụm sân là bắt buộc.';
            this.isLoading = false;
            return;
        }

        const courtData: Court = {
            ...(this.court || {}),
            courtId: this.court?.courtId || 0,
            courtName: value.courtName.trim(),
            courtGroupId: value.courtGroupId,
            location: value.location,
            district: value.district,
            city: value.city,
            pricePerHour: value.pricePerHour,
            status: value.status,
            description: value.description || '',
            // Find Group Name
            courtGroupName: this.courtGroups.find(g => g.courtGroupId == value.courtGroupId)?.courtGroupName
        };

        if (this.court) {
            // Update
            this.courtService.updateCourt(this.court.courtId, courtData).subscribe({
                next: () => {
                    // Nếu có chọn ảnh mới thì upload sau khi cập nhật thông tin sân
                    if (this.selectedImageFiles.length > 0 && !this.courtImages.length) {
                        this.courtService.uploadCourtImages(this.court!.courtId, this.selectedImageFiles).subscribe({
                            next: () => {
                                this.isLoading = false;
                                this.cdr.detectChanges();
                                this.toastService.success('Cập nhật sân và ảnh thành công!', 'Thành công');
                                setTimeout(() => {
                                    this.activeModal.close('saved');
                                }, 300);
                            },
                            error: (err) => {
                                const errorMsg = this.apiService.extractErrorMessage(err) || 'Đã lưu thông tin sân nhưng không thể lưu ảnh.';
                                this.error = errorMsg;
                                this.toastService.error(errorMsg, 'Lỗi lưu ảnh');
                                this.isLoading = false;
                                this.loadImages();
                                this.cdr.detectChanges();
                            }
                        });
                    } else {
                        this.isLoading = false;
                        this.cdr.detectChanges(); // Update UI first
                        this.toastService.success('Cập nhật sân thành công!', 'Thành công');
                        setTimeout(() => {
                            this.activeModal.close('saved');
                        }, 300);
                    }
                },
                error: (err) => {
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể cập nhật sân. Vui lòng thử lại sau.';
                    this.error = errorMsg;
                    this.toastService.error(errorMsg, 'Lỗi cập nhật');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            // Create
            this.courtService.createCourt(courtData).subscribe({
                next: (created) => {
                    // Nếu có chọn ảnh thì upload sau khi tạo sân
                    if (this.selectedImageFiles.length > 0 && created && created.courtId) {
                        this.courtService.uploadCourtImages(created.courtId, this.selectedImageFiles).subscribe({
                            next: () => {
                                this.isLoading = false;
                                this.cdr.detectChanges();
                                this.toastService.success('Tạo sân và ảnh thành công!', 'Thành công');
                                setTimeout(() => {
                                    this.activeModal.close('saved');
                                }, 300);
                            },
                            error: (err) => {
                                const errorMsg = this.apiService.extractErrorMessage(err) || 'Đã tạo sân nhưng không thể lưu ảnh.';
                                this.error = errorMsg;
                                this.toastService.error(errorMsg, 'Lỗi lưu ảnh');
                                this.isLoading = false;
                                this.cdr.detectChanges();
                            }
                        });
                    } else {
                        this.isLoading = false;
                        this.cdr.detectChanges(); // Update UI first
                        this.toastService.success('Tạo sân thành công!', 'Thành công');
                        setTimeout(() => {
                            this.activeModal.close('saved');
                        }, 300);
                    }
                },
                error: (err) => {
                    const errorMsg = this.apiService.extractErrorMessage(err) || 'Không thể tạo sân. Vui lòng thử lại sau.';
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
