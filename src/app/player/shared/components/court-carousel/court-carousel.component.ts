import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Court, CourtStatus } from '../../../models/court.model';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { 
  EnvironmentOutline, 
  EyeOutline, 
  PhoneOutline,
  LeftOutline,
  RightOutline,
  StarFill,
  StarOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-court-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, IconDirective],
  templateUrl: './court-carousel.component.html',
  styleUrls: ['./court-carousel.component.scss']
})
export class CourtCarouselComponent implements OnInit, OnChanges {
  private iconService = inject(IconService);
  private cdr = inject(ChangeDetectorRef);
  
  @Input() courts: Court[] = [];
  @Input() isLoading = false;

  currentIndex = 0;
  itemsPerPage = 4;
  totalPages = 1;
  displayedCourts: Court[] = [];

  constructor() {
    this.iconService.addIcon(
      EnvironmentOutline, 
      EyeOutline,
      PhoneOutline,
      LeftOutline,
      RightOutline,
      StarFill,
      StarOutline
    );
  }

  ngOnInit(): void {
    this.updateDisplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let shouldUpdate = false;
    
    // Handle courts change - always reset and update when courts change
    if (changes['courts']) {
      const previousCourts = changes['courts'].previousValue;
      const currentCourts = changes['courts'].currentValue;
      
      // Check if courts actually changed (by reference or length)
      const courtsChanged = previousCourts !== currentCourts || 
                            (previousCourts?.length !== currentCourts?.length);
      
      if (courtsChanged) {
        this.currentIndex = 0; // Reset to first page when courts change
        shouldUpdate = true;
      }
    }
    
    // Handle loading state change - update display when loading finishes
    if (changes['isLoading']) {
      const wasLoading = changes['isLoading'].previousValue;
      const isLoading = changes['isLoading'].currentValue;
      
      // When loading changes from true to false, ensure display is updated
      if (wasLoading && !isLoading && this.courts && this.courts.length > 0) {
        shouldUpdate = true;
      }
    }
    
    // Update display if needed
    if (shouldUpdate) {
      this.calculateTotalPages();
      this.updateDisplayedCourts();
      this.cdr.detectChanges(); // Use detectChanges instead of markForCheck for immediate update
    }
  }

  updateDisplay(): void {
    this.calculateTotalPages();
    this.updateDisplayedCourts();
  }

  calculateTotalPages(): void {
    if (!this.courts || this.courts.length === 0) {
      this.totalPages = 1;
      return;
    }
    this.totalPages = Math.ceil(this.courts.length / this.itemsPerPage);
  }

  updateDisplayedCourts(): void {
    if (!this.courts || this.courts.length === 0) {
      this.displayedCourts = [];
      return;
    }
    const start = this.currentIndex * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    // Force create new array reference to trigger change detection
    this.displayedCourts = this.courts.slice(start, end).map(c => ({ ...c }));
  }

  getCurrentCourts(): Court[] {
    // Always return fresh data from courts array - this ensures template always gets latest data
    if (!this.courts || this.courts.length === 0) {
      return [];
    }
    const start = this.currentIndex * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.courts.slice(start, end);
  }

  nextSlide(): void {
    if (this.currentIndex < this.totalPages - 1) {
      this.currentIndex++;
      this.updateDisplayedCourts();
    }
  }

  prevSlide(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateDisplayedCourts();
    }
  }

  goToPage(page: number): void {
    this.currentIndex = page;
    this.updateDisplayedCourts();
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
