import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../theme/shared/components/card/card.component';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { ServiceService } from '../../../services/service.service';
import { BookingTimerService } from '../../../services/booking-timer.service';
import { Service } from '../../../models/service.model';
import { Subscription } from 'rxjs';
import {
  CheckCircleOutline,
  PlusOutline,
  MinusOutline,
  WalletOutline,
  CheckOutline,
  ArrowRightOutline,
  EnvironmentOutline,
  ClockCircleOutline
} from '@ant-design/icons-angular/icons';

interface SelectedService {
  service: Service;
  quantity: number;
}

@Component({
  selector: 'app-select-services',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, IconDirective],
  templateUrl: './select-services.component.html',
  styleUrls: ['./select-services.component.scss']
})
export class SelectServicesComponent implements OnInit, OnDestroy {
  private iconService = inject(IconService);
  private cdr = inject(ChangeDetectorRef);
  private bookingTimerService = inject(BookingTimerService);

  services: Service[] = [];
  selectedServices: SelectedService[] = [];
  isLoading = false;
  error = '';

  // Data from previous step
  selectedCourt: any;
  bookingDate = '';
  startTime = '';
  endTime = '';
  totalCourtPrice = 0;

  // Booking Timer
  bookingTimerState$ = this.bookingTimerService.getTimerState();
  bookingTimerState = this.bookingTimerService.getCurrentState();
  private timerSubscription?: Subscription;

  constructor(
    private serviceService: ServiceService,
    private router: Router
  ) {
    this.iconService.addIcon(
      CheckCircleOutline,
      PlusOutline,
      MinusOutline,
      WalletOutline,
      CheckOutline,
      ArrowRightOutline,
      EnvironmentOutline,
      ClockCircleOutline
    );
  }

  ngOnInit(): void {
    const nav = history.state || {};
    console.log('SelectServices Init State:', nav);

    this.selectedCourt = nav.selectedCourt;
    this.bookingDate = nav.bookingDate;
    this.startTime = nav.startTime;
    this.endTime = nav.endTime;
    this.totalCourtPrice = nav.totalCourtPrice || 0;

    if (!this.selectedCourt || !this.bookingDate || !this.startTime || !this.endTime) {
      console.warn('Missing state data, redirecting...');
      this.router.navigate(['/player/booking/select-court']);
      return;
    }

    // Subscribe to booking timer
    this.timerSubscription = this.bookingTimerState$.subscribe(state => {
      this.bookingTimerState = state;
      this.cdr.detectChanges();
      
      // If timer expired, redirect back
      if (!state.isActive && state.reservedSlotIds.length > 0) {
        this.error = 'Thời gian đặt sân đã hết. Vui lòng bắt đầu lại.';
        setTimeout(() => {
          this.router.navigate(['/player/booking/select-court']);
        }, 2000);
      }
    });

    // Timer tiếp tục chạy từ step 1, không reset
    // Update reserved slots nếu có
    const reservedSlotIds = nav.reservedSlotIds || [];
    if (reservedSlotIds.length > 0) {
      this.bookingTimerService.updateReservedSlots(reservedSlotIds);
    }

    this.loadServices();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  loadServices(): void {
    this.isLoading = true;
    this.error = '';

    // Load services for the selected court's court group
    const request = this.selectedCourt?.courtGroupId 
      ? { courtGroupId: this.selectedCourt.courtGroupId }
      : undefined;

    this.serviceService.getServices(request).subscribe({
      next: (services) => {
        console.log('Services loaded:', services);
        this.services = services;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.error = 'Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.';
        this.services = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  changeQuantity(service: Service, delta: number): void {
    const item = this.selectedServices.find(s => s.service.serviceId === service.serviceId);
    if (!item && delta > 0) {
      this.selectedServices.push({ service, quantity: 1 });
      return;
    }
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.selectedServices = this.selectedServices.filter(s => s.service.serviceId !== service.serviceId);
      }
    }
  }

  getQuantity(service: Service): number {
    const item = this.selectedServices.find(s => s.service.serviceId === service.serviceId);
    return item ? item.quantity : 0;
  }

  getServiceTotal(service: Service): number {
    return this.getQuantity(service) * service.price;
  }

  getTotalServicesPrice(): number {
    return this.selectedServices.reduce((sum, item) => sum + item.quantity * item.service.price, 0);
  }

  getTotalBookingPrice(): number {
    return this.totalCourtPrice + this.getTotalServicesPrice();
  }

  goToPayment(): void {
    const servicesPayload = this.selectedServices.map(item => ({
      serviceId: item.service.serviceId,
      quantity: item.quantity
    }));

    // Get reservedSlotIds from state
    const nav = history.state || {};
    const reservedSlotIds = nav.reservedSlotIds || [];

    // Timer tiếp tục chạy, không reset

    this.router.navigate(['/player/booking/payment'], {
      state: {
        selectedCourt: this.selectedCourt,
        bookingDate: this.bookingDate,
        startTime: this.startTime,
        endTime: this.endTime,
        services: servicesPayload,
        courtPrice: this.totalCourtPrice,
        servicesTotal: this.getTotalServicesPrice(),
        grandTotal: this.getTotalBookingPrice(),
        reservedSlotIds: reservedSlotIds
      }
    });
  }

  getBookingTimerText(): string {
    return this.bookingTimerService.formatTime(this.bookingTimerState.remainingSeconds);
  }
}

