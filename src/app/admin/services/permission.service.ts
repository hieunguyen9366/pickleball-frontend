import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ManagerAssignment, AssignCourtGroupsRequest, ManagerCourtGroupsResponse } from '../models/permission.model';
import { ApiService } from '../../common/api.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(private apiService: ApiService) {}

  /**
   * Lấy danh sách cụm sân đã được gán cho một quản lý
   */
  getManagerCourtGroups(managerId: number): Observable<ManagerCourtGroupsResponse> {
    return this.apiService.get<ManagerCourtGroupsResponse>(`permissions/manager/${managerId}`).pipe(
      catchError(error => {
        console.error('Error loading manager court groups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gán cụm sân cho quản lý
   */
  assignCourtGroups(request: AssignCourtGroupsRequest): Observable<ManagerAssignment[]> {
    return this.apiService.post<ManagerAssignment[]>('permissions/assign', request).pipe(
      catchError(error => {
        console.error('Error assigning court groups:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Hủy gán cụm sân cho quản lý
   */
  unassignCourtGroup(managerId: number, courtGroupId: number): Observable<void> {
    return this.apiService.delete<void>(`permissions/unassign/${managerId}/${courtGroupId}`).pipe(
      catchError(error => {
        console.error('Error unassigning court group:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy danh sách tất cả phân quyền
   */
  getAllAssignments(): Observable<ManagerAssignment[]> {
    return this.apiService.get<ManagerAssignment[]>('permissions').pipe(
      catchError(error => {
        console.error('Error loading assignments:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Lấy danh sách cụm sân của một quản lý (theo managerId)
   */
  getCourtGroupsByManager(managerId: number): Observable<any[]> {
    return this.apiService.get<any[]>(`permissions/manager/${managerId}/court-groups`).pipe(
      catchError(error => {
        console.error('Error loading court groups by manager:', error);
        return throwError(() => error);
      })
    );
  }
}

