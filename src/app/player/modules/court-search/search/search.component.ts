import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbPaginationModule, NgbDropdownModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { CourtService } from '../../../services/court.service';
import { ServiceService } from '../../../services/service.service';
import { Court, CourtWithTimeSlot, CourtSearchRequest } from '../../../models/court.model';
import { Service } from '../../../models/service.model';
import { debounceTime, distinctUntilChanged, map, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import {
  SearchOutline,
  FilterOutline,
  StarOutline,
  StarFill,
  EnvironmentOutline,
  AppstoreOutline,
  UnorderedListOutline,
  UndoOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-court-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    CardComponent,
    IconDirective,
    NgbPaginationModule,
    NgbDropdownModule,
    NgbCollapseModule
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  private courtService = inject(CourtService);
  private serviceService = inject(ServiceService);
  private iconService = inject(IconService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Form Controls
  filterForm!: FormGroup;

  // Data
  courts: (Court | CourtWithTimeSlot)[] = [];
  filteredCourts: (Court | CourtWithTimeSlot)[] = [];
  isLoading = false;
  error = '';

  // Options
  districts: string[] = [];
  cities: string[] = [];
  amenitiesList: string[] = [];
  ratingFilter = 0;

  // Pagination
  page = 1;
  pageSize = 9;
  collectionSize = 0;

  // Sorting
  sortBy = 'default';

  constructor(private fb: FormBuilder) {
    this.iconService.addIcon(
      SearchOutline,
      FilterOutline,
      StarOutline,
      StarFill,
      EnvironmentOutline,
      AppstoreOutline,
      UnorderedListOutline,
      UndoOutline
    );
  }

  ngOnInit(): void {
    this.initForm();
    this.loadDistrictsAndCities();
    
    // Đảm bảo loadCourts() được gọi với giá trị mặc định đã được set
    // Sử dụng setTimeout để đảm bảo form đã được init xong
    setTimeout(() => {
      this.loadCourts();
    }, 0);
  }

  loadDistrictsAndCities(): void {
    // Load districts
    this.courtService.getDistricts().subscribe({
      next: (districts) => {
        this.districts = districts;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading districts:', err);
        // Fallback to empty array
        this.districts = [];
      }
    });

    // Load cities
    this.courtService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading cities:', err);
        // Fallback to empty array
        this.cities = [];
      }
    });

    // Load amenities from services
    this.serviceService.getServices().subscribe({
      next: (services) => {
        this.amenitiesList = services.map(s => s.serviceName).filter((name, index, self) => self.indexOf(name) === index);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading amenities:', err);
        // Fallback to empty array
        this.amenitiesList = [];
      }
    });
  }

  initForm(): void {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Default to Current Hour
    let currentHour = now.getHours();

    // Safety check: 
    // If it's 23:00, next hour is 00:00 (tomorrow).
    // For simplicity, let's clamp to max 22 for start hour to allow 1h duration within same day.
    let startH = currentHour;
    if (startH < 5) startH = 5;
    if (startH > 22) startH = 22;

    let endH = startH + 1;

    const defaultStartTime = `${startH.toString().padStart(2, '0')}:00`;
    const defaultEndTime = `${endH.toString().padStart(2, '0')}:00`;

    // Tạo form với default values, nhưng tắt emitEvent để không trigger valueChanges
    this.filterForm = this.fb.group({
      searchTerm: [''],
      // Time Search Cores
      date: [today],
      startTime: [defaultStartTime],
      endTime: [defaultEndTime],

      district: [''],
      minPrice: [null],
      maxPrice: [null],
      amenities: [[]],
      rating: [0]
    }, { emitEvent: false }); // Tắt emitEvent khi init để không trigger valueChanges

    // Debounce search input
    this.filterForm.get('searchTerm')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.loadCourts();
    });

    // Listen to other filter changes (skip initial value)
    this.filterForm.valueChanges.pipe(
      debounceTime(200)
    ).subscribe((val) => {
      this.page = 1;
      this.loadCourts();
    });
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

    // Parse slot info from description (temporary solution)
    let slotId: number | undefined;
    let slotDate: string | undefined;
    let slotStartTime: string | undefined;
    let slotEndTime: string | undefined;
    let isLocked: boolean | undefined;
    let lockedByUserId: number | undefined;
    let description = court.description || '';
    
    if (description && description.includes('SLOT_INFO:')) {
      try {
        const slotInfoMatch = description.match(/SLOT_INFO:({.*?})/);
        if (slotInfoMatch) {
          const slotInfo = JSON.parse(slotInfoMatch[1]);
          slotId = slotInfo.slotId;
          slotDate = slotInfo.slotDate;
          slotStartTime = slotInfo.slotStartTime;
          slotEndTime = slotInfo.slotEndTime;
          isLocked = slotInfo.isLocked || false;
          lockedByUserId = slotInfo.lockedByUserId !== null && slotInfo.lockedByUserId !== 'null' 
            ? slotInfo.lockedByUserId : undefined;
          // Remove slot info from description
          description = description.replace(/\nSLOT_INFO:.*$/, '').trim();
        }
      } catch (e) {
        console.warn('Failed to parse slot info from description:', e);
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
      reviewCount: court.reviewCount || 0,
      description: description,
      // Slot info
      slotId: slotId,
      slotDate: slotDate,
      slotStartTime: slotStartTime,
      slotEndTime: slotEndTime,
      isLocked: isLocked,
      lockedByUserId: lockedByUserId
    };
  }

  // Helper for Template to show total price for duration
  getTotalPrice(court: any): number {
    // Ưu tiên dùng totalPriceForTime từ TimeSlot (đã tính từ API)
    if (court.totalPriceForTime !== undefined && court.totalPriceForTime !== null && court.totalPriceForTime > 0) {
      return court.totalPriceForTime;
    }

    // Fallback: tính từ basePricePerHour nếu chưa có totalPriceForTime
    const val = this.filterForm.value;
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

  getDurationLabel(): string {
    const val = this.filterForm.value;
    if (val.startTime && val.endTime) {
      const startH = parseInt(val.startTime.split(':')[0], 10);
      const endH = parseInt(val.endTime.split(':')[0], 10);
      const duration = endH - startH;
      return duration > 0 ? `/${duration}h` : '';
    }
    return '/h';
  }

  loadCourts(): void {
    this.isLoading = true;
    this.error = '';

    const val = this.filterForm.value;

    // Normalize time format: đảm bảo luôn là "HH:mm" (2 chữ số)
    const normalizeTime = (time: string | null | undefined): string | undefined => {
      if (!time) return undefined;
      const parts = time.split(':');
      if (parts.length === 2) {
        const hour = parts[0].padStart(2, '0');
        const minute = parts[1].padStart(2, '0');
        return `${hour}:${minute}`;
      }
      return time;
    };

    // Construct enhanced search request with all filters
    const request: CourtSearchRequest = {
      searchTerm: val.searchTerm || undefined,
      district: val.district || undefined,
      date: val.date || undefined,
      startTime: normalizeTime(val.startTime),
      endTime: normalizeTime(val.endTime),
      minPrice: val.minPrice || undefined,
      maxPrice: val.maxPrice || undefined,
      minRating: val.rating > 0 ? val.rating : undefined,
      amenities: val.amenities && val.amenities.length > 0 ? val.amenities : undefined,
      sortBy: this.sortBy !== 'default' ? this.sortBy as any : undefined,
      page: this.page,
      pageSize: this.pageSize // Use pageSize for server-side pagination
    };

    // Gọi API search courts với tất cả filters (backend đã xử lý tất cả)
    this.courtService.searchCourts(request).subscribe({
      next: (response) => {
        // Map CourtDTO từ backend sang Court interface (address -> location, images string -> array)
        let result = (response.courts || []).map(court => this.mapCourtDTOToCourt(court));

        // Backend đã xử lý tất cả filters, chỉ cần hiển thị kết quả
        this.courts = result;
        this.filteredCourts = result;
        this.collectionSize = response.total || 0;
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading courts:', err);
        this.error = 'Không thể tải danh sách sân. Vui lòng thử lại sau.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * DEPRECATED: Không cần gọi API cho từng court nữa, backend đã xử lý
   * Giữ lại để tương thích nếu cần
   */
  loadTimeSlotDetailsForCourts(courts: Court[], date: string, startTime: string, endTime: string): void {
    if (courts.length === 0) {
      this.applyFiltersAndDisplay(courts, this.filterForm.value);
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
        // Map kết quả với court info
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
              const courtWithSlot: CourtWithTimeSlot = {
                ...court,
                timeSlot: slotInfo.slot,
                slotStartTime: slotInfo.startTime,
                slotEndTime: slotInfo.endTime,
                slotPrice: slotInfo.price,
                totalPriceForTime: slotInfo.price
              };
              resultsWithTimeSlots.push(courtWithSlot);
            });
          }
        });

        // Apply filters
        this.applyFiltersAndDisplay(resultsWithTimeSlots, this.filterForm.value);
      },
      error: (err) => {
        console.error('Error loading time slot details:', err);
        // Fallback: hiển thị tất cả courts
        this.applyFiltersAndDisplay(courts, this.filterForm.value);
      }
    });
  }

  /**
   * DEPRECATED: Backend đã xử lý tất cả filters
   * Giữ lại để tương thích nếu cần
   */
  applyFiltersAndDisplay(courts: any[], val: any): void {
    // Backend đã xử lý tất cả filters, chỉ cần hiển thị
    this.courts = courts;
    this.filteredCourts = courts;
    this.collectionSize = courts.length;
    
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  // Not used directly anymore, functionality merged into loadCourts
  applyFilters(): void {
    this.loadCourts();
  }

  onSortChange(event: any): void {
    this.sortBy = event.target.value;
    this.loadCourts(); // Re-sort
  }

  /**
   * DEPRECATED: Backend đã xử lý sorting
   * Giữ lại để tương thích nếu cần client-side sort
   */
  sortCourts(courts: Court[]): Court[] {
    // Backend đã sort, chỉ return as-is
    return courts;
  }

  onPageChange(): void {
    this.loadCourts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetFilters(): void {
    const today = new Date().toISOString().split('T')[0];
    this.filterForm.reset({
      searchTerm: '',
      date: today,
      startTime: null,
      endTime: null,
      district: '',
      minPrice: null,
      maxPrice: null,
      amenities: [],
      rating: 0
    });
    this.page = 1;
    this.sortBy = 'default';
    this.loadCourts();
  }

  /**
   * Quick date filters
   */
  setQuickDate(type: 'today' | 'tomorrow'): void {
    const today = new Date();
    let targetDate: Date;
    
    if (type === 'today') {
      targetDate = today;
    } else {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 1);
    }
    
    this.filterForm.patchValue({
      date: targetDate.toISOString().split('T')[0]
    });
  }

  /**
   * Quick time filters
   */
  setQuickTime(period: 'morning' | 'afternoon' | 'evening'): void {
    let startTime: string;
    let endTime: string;
    
    switch (period) {
      case 'morning':
        startTime = '06:00';
        endTime = '12:00';
        break;
      case 'afternoon':
        startTime = '12:00';
        endTime = '18:00';
        break;
      case 'evening':
        startTime = '18:00';
        endTime = '22:00';
        break;
      default:
        return;
    }
    
    this.filterForm.patchValue({
      startTime,
      endTime
    });
  }

  /**
   * Toggle amenity filter
   */
  toggleAmenity(amenity: string, event: any): void {
    const currentAmenities = this.filterForm.get('amenities')?.value || [];
    let newAmenities: string[];
    
    if (event.target.checked) {
      newAmenities = [...currentAmenities, amenity];
    } else {
      newAmenities = currentAmenities.filter((a: string) => a !== amenity);
    }
    
    this.filterForm.patchValue({
      amenities: newAmenities
    });
  }

  // Helper for Template to show slot price
  getSlotPrice(court: any): number {
    // Nếu có slot info, pricePerHour đã được set từ slot price trong backend
    if (court.slotStartTime && court.slotEndTime) {
      // Backend đã set pricePerHour = slotPrice
      return court.pricePerHour || 0;
    }

    // Nếu có slotPrice (từ TimeSlot cụ thể), dùng nó
    if (court.slotPrice !== undefined && court.slotPrice !== null && court.slotPrice > 0) {
      return court.slotPrice;
    }

    // Fallback: dùng totalPriceForTime
    if (court.totalPriceForTime !== undefined && court.totalPriceForTime !== null && court.totalPriceForTime > 0) {
      return court.totalPriceForTime;
    }

    // Fallback: tính từ basePricePerHour
    const val = this.filterForm.value;
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

    // Fallback: dùng filterForm
    return this.getDurationLabel();
  }

  // Helpers
  getStars(rating: number = 0): boolean[] {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < Math.round(rating));
    }
    return stars;
  }
}

