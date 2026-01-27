import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Court, CourtSearchRequest, CourtSearchResponse, CourtDetail, CourtGroup, TimeSlot, CourtStatus } from '../models/court.model';
import { ApiService } from '../../common/api.service';

@Injectable({
  providedIn: 'root'
})
export class CourtService {

  constructor(private apiService: ApiService) {}

  searchCourts(request: CourtSearchRequest): Observable<CourtSearchResponse> {
    const params: any = {
      page: request.page || 1,
      pageSize: request.pageSize || 10
    };

    // Search term
    if (request.searchTerm) params.searchTerm = request.searchTerm;
    
    // Location filters
    if (request.district) params.district = request.district;
    if (request.city) params.city = request.city;
    if (request.courtGroupId) params.courtGroupId = request.courtGroupId;
    
    // Time filters
    if (request.date) params.date = request.date;
    if (request.startTime) params.startTime = request.startTime;
    if (request.endTime) params.endTime = request.endTime;
    
    // Price filters
    if (request.minPrice) params.minPrice = request.minPrice;
    if (request.maxPrice) params.maxPrice = request.maxPrice;
    
    // Rating filter
    if (request.minRating) params.minRating = request.minRating;
    
    // Amenities filter
    if (request.amenities && request.amenities.length > 0) {
      params.amenities = request.amenities;
    }
    
    // Sorting
    if (request.sortBy) params.sortBy = request.sortBy;
    
    // Status filter
    if (request.status) params.status = request.status;

    return this.apiService.get<CourtSearchResponse>('courts/search', { params }).pipe(
      catchError(error => {
        console.error('Error searching courts:', error);
        return throwError(() => error);
      })
    );
  }

  getDistricts(): Observable<string[]> {
    return this.apiService.get<string[]>('courts/districts').pipe(
      catchError(error => {
        console.error('Error loading districts:', error);
        return throwError(() => error);
      })
    );
  }

  getCities(): Observable<string[]> {
    return this.apiService.get<string[]>('courts/cities').pipe(
      catchError(error => {
        console.error('Error loading cities:', error);
        return throwError(() => error);
      })
    );
  }

  getAvailableTimeSlots(courtId: number, date: string): Observable<TimeSlot[]> {
    return this.apiService.get<TimeSlot[]>(`courts/${courtId}/slots`, {
      params: { date }
    }).pipe(
      catchError(error => {
        console.error('Error loading time slots:', error);
        return throwError(() => error);
      })
    );
  }

  checkTimeSlotAvailability(courtId: number, date: string, startTime: string, endTime: string): Observable<{ available: boolean }> {
    return this.apiService.get<{ available: boolean }>(`courts/${courtId}/availability`, {
      params: { date, startTime, endTime }
    }).pipe(
      catchError(error => {
        console.error('Error checking availability:', error);
        return throwError(() => error);
      })
    );
  }

  // --- Court CRUD (Admin) ---

  createCourt(court: Court): Observable<Court> {
    // Map từ frontend model sang backend DTO
    const dto = this.mapCourtToDTO(court);
    return this.apiService.post<any>('courts', dto).pipe(
      map((response: any) => this.mapCourtDTOToCourt(response)),
      catchError(error => {
        console.error('Error creating court:', error);
        return throwError(() => error);
      })
    );
  }

  updateCourt(id: number, court: Court): Observable<Court> {
    // Map từ frontend model sang backend DTO
    const dto = this.mapCourtToDTO(court);
    return this.apiService.put<any>(`courts/${id}`, dto).pipe(
      map((response: any) => this.mapCourtDTOToCourt(response)),
      catchError(error => {
        console.error('Error updating court:', error);
        return throwError(() => error);
      })
    );
  }

  deleteCourt(id: number): Observable<void> {
    return this.apiService.delete<void>(`courts/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting court:', error);
        return throwError(() => error);
      })
    );
  }

  getCourtById(courtId: number): Observable<CourtDetail> {
    return this.apiService.get<CourtDetail>(`courts/${courtId}`).pipe(
      catchError(error => {
        console.error('Error loading court:', error);
        return throwError(() => error);
      })
    );
  }

  // --- Court Group Management (Admin) ---

  getCourtGroups(managerId?: number): Observable<CourtGroup[]> {
    const params: any = {};
    if (managerId) params.managerId = managerId;

    return this.apiService.get<any[]>('courts/groups', { params }).pipe(
      map((groups: any[]) => groups.map(g => this.mapCourtGroupDTOToCourtGroup(g))),
      catchError(error => {
        console.error('Error loading court groups:', error);
        return throwError(() => error);
      })
    );
  }

  getCourtGroupById(id: number): Observable<CourtGroup> {
    return this.apiService.get<any>(`courts/groups/${id}`).pipe(
      map((dto: any) => this.mapCourtGroupDTOToCourtGroup(dto)),
      catchError(error => {
        console.error('Error loading court group:', error);
        return throwError(() => error);
      })
    );
  }

  createCourtGroup(group: CourtGroup): Observable<CourtGroup> {
    // Map từ frontend model (courtGroupName) sang backend DTO (groupName)
    const dto = this.mapCourtGroupToDTO(group);
    return this.apiService.post<any>('courts/groups', dto).pipe(
      map((response: any) => this.mapCourtGroupDTOToCourtGroup(response)),
      catchError(error => {
        console.error('Error creating court group:', error);
        return throwError(() => error);
      })
    );
  }

  updateCourtGroup(id: number, group: CourtGroup): Observable<CourtGroup> {
    // Map từ frontend model (courtGroupName) sang backend DTO (groupName)
    const dto = this.mapCourtGroupToDTO(group);
    return this.apiService.put<any>(`courts/groups/${id}`, dto).pipe(
      map((response: any) => this.mapCourtGroupDTOToCourtGroup(response)),
      catchError(error => {
        console.error('Error updating court group:', error);
        return throwError(() => error);
      })
    );
  }

  deleteCourtGroup(id: number): Observable<void> {
    return this.apiService.delete<void>(`courts/groups/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting court group:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Map từ backend DTO (groupName) sang frontend model (courtGroupName)
   */
  private mapCourtGroupDTOToCourtGroup(dto: any): CourtGroup {
    if (!dto) {
      throw new Error('Invalid court group data');
    }
    return {
      courtGroupId: dto.courtGroupId || dto.court_group_id || 0,
      courtGroupName: dto.groupName || dto.group_name || dto.courtGroupName || '', // Backend trả về groupName
      address: dto.address || '',
      district: dto.district || '',
      city: dto.city || '',
      description: dto.description || '',
      managerId: dto.managerId || dto.manager_id || undefined,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined
    };
  }

  /**
   * Map từ frontend model (courtGroupName) sang backend DTO (groupName)
   */
  private mapCourtGroupToDTO(group: CourtGroup): any {
    return {
      groupName: group.courtGroupName, // Frontend dùng courtGroupName, backend expect groupName
      address: group.address,
      district: group.district,
      city: group.city,
      description: group.description,
      managerId: group.managerId || null
    };
  }

  /**
   * Map từ backend DTO sang frontend Court model
   */
  private mapCourtDTOToCourt(dto: any): Court {
    if (!dto) {
      throw new Error('Invalid court data');
    }
    return {
      courtId: dto.courtId || dto.court_id || 0,
      courtName: dto.courtName || dto.court_name || '',
      courtGroupId: dto.courtGroupId || dto.court_group_id || 0,
      courtGroupName: dto.courtGroupName || dto.court_group_name,
      location: dto.address || dto.location || '', // Backend trả về address, frontend dùng location
      district: dto.district || '',
      city: dto.city || '',
      pricePerHour: dto.basePricePerHour ? Number(dto.basePricePerHour) : (dto.pricePerHour ? Number(dto.pricePerHour) : 0), // Backend dùng basePricePerHour
      status: dto.status as CourtStatus || CourtStatus.AVAILABLE,
      images: dto.images ? (Array.isArray(dto.images) ? dto.images : [dto.images]) : [],
      description: dto.description || '',
      amenities: dto.amenities || [],
      phone: dto.phone || '',
      rating: dto.rating || undefined,
      reviewCount: dto.reviewCount || dto.review_count || undefined,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined
    };
  }

  /**
   * Map từ frontend Court model sang backend DTO
   */
  private mapCourtToDTO(court: Court): any {
    return {
      courtGroupId: court.courtGroupId,
      courtName: court.courtName,
      status: court.status,
      basePricePerHour: court.pricePerHour // Frontend dùng pricePerHour, backend expect basePricePerHour
    };
  }

  /**
   * Calculate dynamic price based on hour of day
   * Peak hours (17:00 - 22:00) : 100% price (or surcharge)
   * Off-peak: Lower price
   * 
   * Note: This is a helper method for client-side calculation.
   * In production, pricing should be calculated by backend based on dynamic pricing config.
   */
  getDynamicPrice(basePrice: number, hour: number): number {
    // Peak hours: 17h - 21h
    if (hour >= 17 && hour < 21) {
      return basePrice; // Standard/Max price
    }
    // Morning: 5h - 9h
    if (hour >= 5 && hour < 9) {
      return basePrice * 0.8; // 20% discount
    }
    // Day time: 9h - 17h (Hot/Sunny)
    if (hour >= 9 && hour < 17) {
      return basePrice * 0.6; // 40% discount
    }
    // Late night: 21h - 23h
    return basePrice * 0.7; // 30% discount
  }
}

