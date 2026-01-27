import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { ApiService } from '../../common/api.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    constructor(private apiService: ApiService) {}

    getUsersByRole(role: UserRole): Observable<User[]> {
        return this.apiService.get<User[]>('users', {
            params: { role }
        }).pipe(
            catchError(error => {
                console.error('Error loading users:', error);
                return throwError(() => error);
            })
        );
    }

    createUser(user: User): Observable<User> {
        return this.apiService.post<User>('users', user).pipe(
            catchError(error => {
                console.error('Error creating user:', error);
                return throwError(() => error);
            })
        );
    }

    updateUser(id: number, user: User): Observable<User> {
        return this.apiService.put<User>(`users/${id}`, user).pipe(
            catchError(error => {
                console.error('Error updating user:', error);
                return throwError(() => error);
            })
        );
    }

    deleteUser(id: number): Observable<void> {
        return this.apiService.delete<void>(`users/${id}`).pipe(
            catchError(error => {
                console.error('Error deleting user:', error);
                return throwError(() => error);
            })
        );
    }

    blockUser(id: number): Observable<void> {
        return this.apiService.put<void>(`users/${id}/block`, {}).pipe(
            catchError(error => {
                console.error('Error blocking user:', error);
                return throwError(() => error);
            })
        );
    }

    unblockUser(id: number): Observable<void> {
        return this.apiService.put<void>(`users/${id}/unblock`, {}).pipe(
            catchError(error => {
                console.error('Error unblocking user:', error);
                return throwError(() => error);
            })
        );
    }

    resetPassword(id: number): Observable<{ newPassword: string; message: string }> {
        return this.apiService.post<{ newPassword: string; message: string }>(`users/${id}/reset-password`, {}).pipe(
            catchError(error => {
                console.error('Error resetting password:', error);
                return throwError(() => error);
            })
        );
    }
}
