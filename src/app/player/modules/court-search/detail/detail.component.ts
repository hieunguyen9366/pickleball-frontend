import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { CourtService } from '../../../services/court.service';
import { Court } from '../../../models/court.model';
import { ApiService } from '../../../../common/api.service';
import {
  EnvironmentOutline,
  WalletOutline,
  StarOutline,
  CalendarOutline,
  ClockCircleOutline,
  PhoneOutline,
  CheckCircleOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-court-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, IconDirective, NgbCarouselModule],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  private iconService = inject(IconService);
  private cdr = inject(ChangeDetectorRef);

  court: Court | null = null;
  isLoading = false;
  error = '';
  ratingStars = [1, 2, 3, 4, 5];

  // Mock reviews for display
  reviews: any[] = [];

  constructor(
    private courtService: CourtService,
    private router: Router,
    public route: ActivatedRoute,
    private apiService: ApiService
  ) {
    this.iconService.addIcon(
      EnvironmentOutline,
      WalletOutline,
      StarOutline,
      CalendarOutline,
      ClockCircleOutline,
      PhoneOutline,
      CheckCircleOutline
    );
  }

  ngOnInit(): void {
    // Scroll lên đầu trang khi vào chi tiết sân
    window.scrollTo({ top: 0, behavior: 'auto' });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadCourt(id);
    } else {
      this.error = 'Không tìm thấy ID sân.';
    }
  }

  loadCourt(id: number): void {
    this.isLoading = true;
    this.error = '';

    // Sử dụng API getCourtById thay vì searchCourts
    this.courtService.getCourtById(id).subscribe({
      next: (courtDetail) => {
        // Map CourtDetailDTO from backend to Court format for display
        // Backend returns CourtDetailDTO with address and basePricePerHour
        const detail = courtDetail as any;
        this.court = {
          courtId: courtDetail.courtId,
          courtName: courtDetail.courtName,
          courtGroupId: courtDetail.courtGroupId,
          courtGroupName: detail.courtGroupName || '',
          location: detail.address || '',
          district: detail.district || '',
          city: detail.city || '',
          pricePerHour: typeof detail.basePricePerHour === 'number' 
            ? detail.basePricePerHour 
            : (detail.basePricePerHour?.toNumber?.() || courtDetail.pricePerHour || 0),
          status: courtDetail.status,
          images: Array.isArray(courtDetail.images) ? courtDetail.images : (detail.images ? [detail.images] : []),
          description: detail.description || '',
          amenities: [],
          phone: '',
          rating: detail.averageRating || 0,
          reviewCount: 0
        };
        
        // Generate mock reviews based on reviewCount
        this.generateMockReviews();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading court detail:', error);
        this.error = this.apiService.extractErrorMessage(error) || 'Không thể tải thông tin sân. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generateMockReviews(): void {
    if (!this.court || !this.court.reviewCount) return;

    const count = this.court.reviewCount;
    const users = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Hoàng C', 'Phạm Minh D', 'Hoàng Văn E', 'Vũ Thị F', 'Đặng Thành G', 'Bùi Minh H'];
    const comments = [
      'Sân đẹp, thoáng mát, chủ sân nhiệt tình.',
      'Mặt sân chất lượng tốt, sẽ quay lại.',
      'Giá cả hợp lý, tuy nhiên hơi đông vào giờ cao điểm.',
      'Dịch vụ tốt, có chỗ để xe rộng rãi.',
      'Đèn sáng, chơi buổi tối rất oke.',
      'Tuyệt vời! Một địa điểm lý tưởng để giao lưu pickleball.'
    ];

    this.reviews = Array.from({ length: Math.min(count, 15) }, (_, i) => ({
      user: users[i % users.length],
      avatar: 'assets/images/user/avatar-' + ((i % 4) + 1) + '.jpg', // Mock avatar path if exists, or use placeholder generic
      rating: 4 + Math.random(), // Random between 4 and 5
      date: new Date(new Date().setDate(new Date().getDate() - i * 3)).toLocaleDateString('vi-VN'),
      comment: comments[i % comments.length]
    })).map(r => ({ ...r, rating: Math.round(r.rating * 10) / 10 })); // Round to 1 decimal
  }

  // Display helper
  getTotalPrice(): number {
    if (!this.court) return 0;

    const startTime = this.route.snapshot.queryParamMap.get('startTime');
    const endTime = this.route.snapshot.queryParamMap.get('endTime');

    if (startTime && endTime) {
      const startH = parseInt(startTime.split(':')[0], 10);
      const endH = parseInt(endTime.split(':')[0], 10);

      let total = 0;
      for (let h = startH; h < endH; h++) {
        total += this.courtService.getDynamicPrice(this.court.pricePerHour, h);
      }
      return total;
    }
    return this.court.pricePerHour;
  }

  getDurationLabel(): string {
    const startTime = this.route.snapshot.queryParamMap.get('startTime');
    const endTime = this.route.snapshot.queryParamMap.get('endTime');

    if (startTime && endTime) {
      const startH = parseInt(startTime.split(':')[0], 10);
      const endH = parseInt(endTime.split(':')[0], 10);
      const duration = endH - startH;
      return duration > 0 ? `/${duration}h` : '';
    }
    return '/h';
  }

  goToBooking(): void {
    if (!this.court) return;

    // Read context from URL (passed from Search)
    const params = this.route.snapshot.queryParamMap;
    const bookingDate = params.get('date');
    const startTime = params.get('startTime');
    const endTime = params.get('endTime');

    this.router.navigate(['/player/booking/select-court'], {
      state: {
        selectedCourt: this.court,
        bookingDate,
        startTime,
        endTime
      }
    });
  }
}

