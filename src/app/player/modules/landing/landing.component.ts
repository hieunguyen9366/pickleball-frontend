import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourtService } from '../../services/court.service';
import { Court, CourtStatus, CourtWithTimeSlot } from '../../models/court.model';
import { CourtSearchRequest } from '../../models/court.model';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CourtListComponent } from '../../shared/components/court-list/court-list.component';
import { CardComponent } from '../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { ApiService } from '../../../common/api.service';
import {
  SearchOutline,
  UserAddOutline,
  EyeOutline,
  ClockCircleOutline,
  CreditCardOutline,
  CheckCircleOutline,
  StarOutline,
  StarFill,
  TagOutline,
  EnvironmentOutline,
  UnorderedListOutline,
  PhoneOutline,
  LeftOutline,
  RightOutline,
  PlusOutline,
  CheckOutline,
  WalletOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CourtListComponent,
    CardComponent,
    IconDirective
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  private iconService = inject(IconService);
  private cdr = inject(ChangeDetectorRef);

  featuredCourts: Court[] = [];
  searchResults: (Court | CourtWithTimeSlot)[] = [];
  loading = false;
  loadingFeatured = false;
  loadingSearch = false;
  error = '';
  showRegistrationSuccess = false;

  // Carousel state for search results
  currentSearchIndex = 0;
  itemsPerPage = 4;
  totalSearchPages = 1;

  // Search form
  searchForm: FormGroup;
  todayDate: string;

  constructor(
    private courtService: CourtService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    // Register icons
    this.iconService.addIcon(
      SearchOutline,
      UserAddOutline,
      EyeOutline,
      ClockCircleOutline,
      CreditCardOutline,
      CheckCircleOutline,
      StarOutline,
      StarFill,
      TagOutline,
      EnvironmentOutline,
      UnorderedListOutline,
      PhoneOutline,
      LeftOutline,
      RightOutline,
      PlusOutline,
      CheckOutline,
      WalletOutline
    );
  }

  ngOnInit(): void {
    // Check if user just registered
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.showRegistrationSuccess = true;
        // Auto hide after 5 seconds
        setTimeout(() => {
          this.showRegistrationSuccess = false;
          // Remove query param from URL
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
        }, 5000);
      }
    });

    // Initialize search form
    this.todayDate = this.getTodayDate();

    // Default to Current Hour (+1 duration)
    const now = new Date();
    let startH = now.getHours();
    if (startH < 5) startH = 5;
    if (startH > 22) startH = 22;

    const endH = startH + 1;

    const defaultStartTime = `${startH.toString().padStart(2, '0')}:00`;
    const defaultEndTime = `${endH.toString().padStart(2, '0')}:00`;

    this.searchForm = this.fb.group({
      district: [''],
      city: [''],
      date: [this.todayDate],
      startTime: [defaultStartTime],
      endTime: [defaultEndTime]
    });

    this.loadFeaturedCourts();
    // Auto search with default time context
    this.loadInitialSearchResults();
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onSearchSubmit(): void {
    // Always submit, even if form is not fully filled
    const searchRequest: CourtSearchRequest = {
      district: this.searchForm.value.district?.trim() || undefined,
      city: this.searchForm.value.city?.trim() || undefined,
      date: this.searchForm.value.date || undefined,
      startTime: this.searchForm.value.startTime || undefined,
      endTime: this.searchForm.value.endTime || undefined,
      page: 1,
      pageSize: 10
    };
    this.onSearch(searchRequest);
  }

  loadInitialSearchResults(): void {
    this.loadingSearch = true;
    this.loading = true;

    // Use the default form values for initial search
    const val = this.searchForm.value;

    const request: CourtSearchRequest = {
      page: 1,
      pageSize: 10,
      date: val.date,
      startTime: val.startTime,
      endTime: val.endTime
    };

    // Gọi API search courts (backend đã check availability từ TimeSlot)
    this.courtService.searchCourts(request).subscribe({
      next: (response) => {
        // Map CourtDTO từ backend sang Court interface (address -> location, images string -> array)
        let courts = (response.courts || []).map(court => this.mapCourtDTOToCourt(court));

        // Nếu có date và time, gọi API TimeSlot để lấy thông tin chi tiết (giá từ TimeSlot)
        if (val.date && val.startTime && val.endTime) {
          this.loadTimeSlotDetailsForCourts(courts, val.date, val.startTime, val.endTime);
        } else {
          // Không có date/time, hiển thị trực tiếp
          this.searchResults = [...courts];
          this.calculateSearchPages();
          this.currentSearchIndex = 0;
          this.loadingSearch = false;
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading search results:', error);
        this.error = 'Không thể tải danh sách sân';
        this.searchResults = [];
        this.loadingSearch = false;
        this.loading = false;
      }
    });
  }

  loadFeaturedCourts(): void {
    this.loadingFeatured = true;
    // Load featured courts (có thể thêm flag featured trong API)
    const request: CourtSearchRequest = {
      page: 1,
      pageSize: 10
    };

    this.courtService.searchCourts(request).subscribe({
      next: (response) => {
        // Map CourtDTO từ backend sang Court interface
        this.featuredCourts = (response.courts || []).map(court => this.mapCourtDTOToCourt(court)).slice(0, 6); // Show 6 in featured section
        this.loadingFeatured = false;
      },
      error: (error) => {
        console.error('Error loading featured courts:', error);
        this.error = this.apiService.extractErrorMessage(error) || 'Không thể tải danh sách sân nổi bật';
        this.featuredCourts = [];
        this.loadingFeatured = false;
      }
    });
  }

  onSearch(searchRequest: CourtSearchRequest): void {
    this.loadingSearch = true;
    this.loading = true;
    this.error = '';

    // Ensure we get 10 courts
    const searchWithPagination: CourtSearchRequest = {
      ...searchRequest,
      page: searchRequest.page || 1,
      pageSize: searchRequest.pageSize || 10
    };

    // Gọi API search courts (backend đã check availability từ TimeSlot)
    this.courtService.searchCourts(searchWithPagination).subscribe({
      next: (response) => {
        // Map CourtDTO từ backend sang Court interface (address -> location, images string -> array)
        let courts = (response.courts || []).map(court => this.mapCourtDTOToCourt(court));

        // Nếu có date và time, gọi API TimeSlot để lấy thông tin chi tiết
        if (searchRequest.date && searchRequest.startTime && searchRequest.endTime) {
          this.loadTimeSlotDetailsForCourts(courts, searchRequest.date, searchRequest.startTime, searchRequest.endTime);
        } else {
          // Không có date/time, hiển thị trực tiếp
          this.searchResults = [...courts];
          this.calculateSearchPages();
          this.currentSearchIndex = 0;
          this.loadingSearch = false;
          this.loading = false;
          this.cdr.detectChanges();

          // Scroll to results section
          setTimeout(() => {
            const element = document.getElementById('court-results');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      },
      error: (error) => {
        console.error('Error searching courts:', error);
        this.error = this.apiService.extractErrorMessage(error) || 'Không thể tìm kiếm sân. Vui lòng thử lại sau.';
        this.searchResults = [];
        this.loadingSearch = false;
        this.loading = false;
      }
    });
  }

  /**
   * Gọi API TimeSlot cho từng court để lấy thông tin availability và giá
   */
  loadTimeSlotDetailsForCourts(courts: Court[], date: string, startTime: string, endTime: string): void {
    if (courts.length === 0) {
      this.searchResults = [];
      this.calculateSearchPages();
      this.currentSearchIndex = 0;
      this.loadingSearch = false;
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    // Gọi API check availability cho từng court
    const availabilityChecks = courts.map(court => 
      this.courtService.checkTimeSlotAvailability(
        court.courtId, 
        date, 
        startTime, 
        endTime
      ).pipe(
        map(availability => ({
          court,
          available: availability.available
        })),
        catchError(error => {
          console.error(`Error checking availability for court ${court.courtId}:`, error);
          return of({ court, available: false });
        })
      )
    );

    // Gọi API get time slots để lấy từng slot riêng biệt
    const timeSlotChecks = courts.map(court =>
      this.courtService.getAvailableTimeSlots(court.courtId, date).pipe(
        map(slots => {
          // Tìm tất cả slots available trong khoảng thời gian
          const startH = parseInt(startTime.split(':')[0], 10);
          const endH = parseInt(endTime.split(':')[0], 10);
          
          // Tìm các slots overlap với khoảng thời gian tìm kiếm
          const matchingSlots = slots.filter(s => {
            // Backend trả về 'time' (String từ startTime.toString())
            const sTime = (s as any).time || s.startTime;
            const sEndTime = (s as any).endTime || s.endTime;
            if (!sTime || !sEndTime) return false;
            
            // Parse time từ slot
            const slotStartH = parseInt(sTime.split(':')[0], 10);
            const slotStartM = parseInt(sTime.split(':')[1] || '0', 10);
            const slotEndH = parseInt(sEndTime.split(':')[0], 10);
            const slotEndM = parseInt(sEndTime.split(':')[1] || '0', 10);
            
            // Slot phải available và overlap với khoảng thời gian tìm kiếm
            const isAvailable = s.isAvailable !== false && (s as any).available !== false && (s as any).isAvailable !== false;
            if (!isAvailable) return false;
            
            // Check overlap: slot start < search end && slot end > search start
            const slotStartMinutes = slotStartH * 60 + slotStartM;
            const slotEndMinutes = slotEndH * 60 + slotEndM;
            const searchStartMinutes = startH * 60;
            const searchEndMinutes = endH * 60;
            
            return slotStartMinutes < searchEndMinutes && slotEndMinutes > searchStartMinutes;
          });
          
          // Tạo danh sách kết quả - mỗi slot là 1 kết quả riêng
          const courtWithSlots: { court: Court; slots: any[] } = {
            court,
            slots: matchingSlots.map(slot => {
              const sTime = (slot as any).time || slot.startTime;
              const sEndTime = (slot as any).endTime || slot.endTime;
              const slotPrice = slot.price || (slot as any).price || court.pricePerHour;
              
              return {
                slot,
                startTime: sTime,
                endTime: sEndTime,
                price: typeof slotPrice === 'number' ? slotPrice : (slotPrice?.toNumber?.() || court.pricePerHour)
              };
            })
          };
          
          return courtWithSlots;
        }),
        catchError(error => {
          console.error(`Error loading time slots for court ${court.courtId}:`, error);
          return of({
            court,
            slots: []
          });
        })
      )
    );

    // Combine cả 2 checks
    forkJoin({
      availability: forkJoin(availabilityChecks),
      slots: forkJoin(timeSlotChecks)
    }).subscribe({
      next: (results) => {
        // Tạo danh sách kết quả - mỗi TimeSlot là 1 kết quả riêng biệt
        const resultsWithTimeSlots: CourtWithTimeSlot[] = [];
        
        courts.forEach(court => {
          const slotData = results.slots.find(s => s.court.courtId === court.courtId);
          
          if (slotData && slotData.slots && slotData.slots.length > 0) {
            // Với mỗi slot, tạo 1 kết quả riêng
            slotData.slots.forEach((slotInfo: any) => {
              resultsWithTimeSlots.push({
                ...court,
                timeSlot: slotInfo.slot,
                slotStartTime: slotInfo.startTime,
                slotEndTime: slotInfo.endTime,
                slotPrice: slotInfo.price
              } as CourtWithTimeSlot);
            });
          }
        });

        this.searchResults = [...resultsWithTimeSlots];
        this.calculateSearchPages();
        this.currentSearchIndex = 0;
        this.loadingSearch = false;
        this.loading = false;
        this.cdr.detectChanges();

        // Scroll to results section
        setTimeout(() => {
          const element = document.getElementById('court-results');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      },
      error: (err) => {
        console.error('Error loading time slot details:', err);
        // Fallback: hiển thị tất cả courts
        this.searchResults = [...courts];
        this.calculateSearchPages();
        this.currentSearchIndex = 0;
        this.loadingSearch = false;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewAllCourts(): void {
    this.router.navigate(['/player/court-search']);
  }

  clearError(): void {
    this.error = '';
  }

  /**
   * Map CourtDTO từ backend sang Court interface
   */
  mapCourtDTOToCourt(court: any): Court {
    // Parse images từ string sang array
    let images: string[] = [];
    if (court.images) {
      if (Array.isArray(court.images)) {
        images = court.images;
      } else if (typeof court.images === 'string') {
        try {
          // Thử parse JSON array
          images = JSON.parse(court.images);
        } catch {
          // Nếu không phải JSON, split bằng comma hoặc dùng như single image
          images = court.images.split(',').map((img: string) => img.trim()).filter((img: string) => img);
          if (images.length === 0) {
            images = [court.images];
          }
        }
      }
    }

    return {
      ...court,
      location: court.address || court.location || '', // Map address -> location
      pricePerHour: typeof court.basePricePerHour === 'number' 
        ? court.basePricePerHour 
        : (court.basePricePerHour?.toNumber?.() || court.pricePerHour || 0),
      images: images.length > 0 ? images : undefined,
      amenities: court.amenities || [],
      phone: court.phone || '',
      rating: court.rating || 0,
      reviewCount: court.reviewCount || 0
    };
  }

  // Helper for Template to show slot price
  getSlotPrice(court: any): number {
    // Nếu có slotPrice (từ TimeSlot cụ thể), dùng nó
    if (court.slotPrice !== undefined && court.slotPrice !== null && court.slotPrice > 0) {
      return court.slotPrice;
    }
    
    // Fallback: dùng totalPriceForTime
    if (court.totalPriceForTime !== undefined && court.totalPriceForTime !== null && court.totalPriceForTime > 0) {
      return court.totalPriceForTime;
    }

    // Fallback: tính từ basePricePerHour
    const val = this.searchForm.value;
    if (val.startTime && val.endTime) {
      const startH = parseInt(val.startTime.split(':')[0], 10);
      const endH = parseInt(val.endTime.split(':')[0], 10);

      if (startH < endH) {
        let total = 0;
        for (let h = startH; h < endH; h++) {
          total += this.courtService.getDynamicPrice(court.pricePerHour || 0, h);
        }
        return total;
      }
    }
    
    // Fallback cuối cùng: trả về giá 1 giờ
    return court.pricePerHour || 0;
  }

  // Helper for Template to show slot duration
  getSlotDurationLabel(court: any): string {
    // Nếu có slotStartTime và slotEndTime, tính duration từ đó
    if (court.slotStartTime && court.slotEndTime) {
      const startH = parseInt(court.slotStartTime.split(':')[0], 10);
      const startM = parseInt(court.slotStartTime.split(':')[1] || '0', 10);
      const endH = parseInt(court.slotEndTime.split(':')[0], 10);
      const endM = parseInt(court.slotEndTime.split(':')[1] || '0', 10);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const durationMinutes = endMinutes - startMinutes;
      const durationHours = durationMinutes / 60;
      
      if (durationHours >= 1) {
        return `/${durationHours.toFixed(1)}h`;
      } else {
        return `/${durationMinutes}phút`;
      }
    }
    
    // Fallback: dùng searchForm
    return this.getDurationLabel();
  }

  // Helper for Template to show total price for duration (legacy - giữ để tương thích)
  getTotalPrice(court: any): number {
    return this.getSlotPrice(court);
  }

  getDurationLabel(): string {
    const val = this.searchForm.value;
    if (val.startTime && val.endTime) {
      const startH = parseInt(val.startTime.split(':')[0], 10);
      const endH = parseInt(val.endTime.split(':')[0], 10);
      const duration = endH - startH;
      return duration > 0 ? `/${duration}h` : '';
    }
    return '/h';
  }

  // Carousel methods for search results
  getCurrentSearchCourts(): (Court | CourtWithTimeSlot)[] {
    if (!this.searchResults || this.searchResults.length === 0) {
      return [];
    }
    const start = this.currentSearchIndex * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.searchResults.slice(start, end);
  }

  calculateSearchPages(): void {
    if (!this.searchResults || this.searchResults.length === 0) {
      this.totalSearchPages = 1;
      this.currentSearchIndex = 0;
      return;
    }
    this.totalSearchPages = Math.ceil(this.searchResults.length / this.itemsPerPage);
    // Ensure currentIndex doesn't exceed totalPages
    if (this.currentSearchIndex >= this.totalSearchPages) {
      this.currentSearchIndex = 0;
    }
  }

  nextSearchSlide(): void {
    if (this.currentSearchIndex < this.totalSearchPages - 1) {
      this.currentSearchIndex++;
    }
  }

  prevSearchSlide(): void {
    if (this.currentSearchIndex > 0) {
      this.currentSearchIndex--;
    }
  }

  goToSearchPage(page: number): void {
    this.currentSearchIndex = page;
  }

  getCourtImage(court: Court): string {
    return court.images && court.images.length > 0
      ? court.images[0]
      : 'assets/images/index.jpg';
  }

  getStatusBadgeText(status: CourtStatus): string {
    switch (status) {
      case CourtStatus.AVAILABLE:
        return 'CÒN TRỐNG';
      case CourtStatus.INACTIVE:
        return 'ĐÓNG CỬA';
      case CourtStatus.BOOKED:
        return 'ĐÃ ĐẶT';
      case CourtStatus.MAINTENANCE:
        return 'BẢO TRÌ';
      default:
        return 'KHÔNG XÁC ĐỊNH';
    }
  }

  getStatusBadgeClass(status: CourtStatus): string {
    switch (status) {
      case CourtStatus.AVAILABLE:
        return 'badge-available';
      case CourtStatus.INACTIVE:
        return 'badge-closed';
      case CourtStatus.BOOKED:
        return 'badge-booked';
      case CourtStatus.MAINTENANCE:
        return 'badge-maintenance';
      default:
        return '';
    }
  }

  getStars(rating: number = 0): boolean[] {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < Math.round(rating));
    }
    return stars;
  }
}

