import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Service, ServiceListRequest } from '../models/service.model';
import { ApiService } from '../../common/api.service';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  constructor(private apiService: ApiService) { }

  getServices(request?: ServiceListRequest): Observable<Service[]> {
    const params: any = {};

    if (request?.courtGroupId && request.courtGroupId !== undefined) params.courtGroupId = request.courtGroupId;
    if (request?.status && request.status !== undefined) params.status = request.status;
    if (request?.search && request.search !== undefined) params.search = request.search;

    return this.apiService.get<Service[]>('services', { params }).pipe(
      catchError(error => {
        console.error('Error loading services:', error);
        return throwError(() => error);
      })
    );
  }

  getServiceById(serviceId: number): Observable<Service> {
    return this.apiService.get<Service>(`services/${serviceId}`).pipe(
      catchError(error => {
        console.error('Error loading service:', error);
        return throwError(() => error);
      })
    );
  }

  createService(service: Service): Observable<Service> {
    return this.apiService.post<Service>('services', service).pipe(
      catchError(error => {
        console.error('Error creating service:', error);
        return throwError(() => error);
      })
    );
  }

  updateService(id: number, service: Service): Observable<Service> {
    return this.apiService.put<Service>(`services/${id}`, service).pipe(
      catchError(error => {
        console.error('Error updating service:', error);
        return throwError(() => error);
      })
    );
  }

  deleteService(id: number): Observable<void> {
    return this.apiService.delete<void>(`services/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting service:', error);
        return throwError(() => error);
      })
    );
  }
}

