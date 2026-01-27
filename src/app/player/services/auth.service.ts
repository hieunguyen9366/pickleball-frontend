import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, AuthResponse, User, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest, UpdateProfileRequest, UserRole } from '../models/user.model';
import { ApiService } from '../../common/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<any>('auth/login', credentials).pipe(
      map((backendResponse: any) => {
        // Backend returns: ApiResponse<AuthResponse> where AuthResponse has: token, refreshToken, type, id, email, role, fullName
        const authData = backendResponse.data || backendResponse;
        const authResponse: AuthResponse = {
          token: authData.token,
          refreshToken: authData.refreshToken,
          user: {
            userId: authData.id,
            fullName: authData.fullName,
            email: authData.email,
            phoneNumber: authData.phoneNumber, // May be null if not in response
            role: authData.role as UserRole,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          expiresIn: 86400 // 24 hours
        };
        this.setAuthData(authResponse);
        return authResponse;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<any>('auth/register', data).pipe(
      map((backendResponse: any) => {
        // Backend returns: ApiResponse<AuthResponse>
        const authData = backendResponse.data || backendResponse;
        const authResponse: AuthResponse = {
          token: authData.token,
          refreshToken: authData.refreshToken,
          user: {
            userId: authData.id,
            fullName: authData.fullName,
            email: authData.email,
            phoneNumber: data.phoneNumber, // Use from request if not in response
            role: (authData.role || UserRole.CUSTOMER) as UserRole,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          expiresIn: 86400
        };
        this.setAuthData(authResponse);
        return authResponse;
      }),
      catchError(error => {
        console.error('Register error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // Clear local auth data
    this.clearAuthData();
    // Note: Backend logout endpoint may not be needed if using stateless JWT
    // If needed, call: this.apiService.post('auth/logout', {}).subscribe();
  }


  forgotPassword(data: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>('auth/forgot-password', data).pipe(
      map((response: any) => ({
        message: response.data?.message || response.message || 'Email khôi phục mật khẩu đã được gửi'
      })),
      catchError(error => {
        console.error('Forgot password error:', error);
        return throwError(() => error);
      })
    );
  }

  resetPassword(data: ResetPasswordRequest): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>('auth/reset-password', data).pipe(
      map((response: any) => ({
        message: response.data?.message || response.message || 'Mật khẩu đã được đặt lại thành công'
      })),
      catchError(error => {
        console.error('Reset password error:', error);
        return throwError(() => error);
      })
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.apiService.post<{ message: string }>('auth/change-password', data).pipe(
      map((response: any) => ({
        message: response.data?.message || response.message || 'Mật khẩu đã được thay đổi thành công'
      })),
      catchError(error => {
        console.error('Change password error:', error);
        return throwError(() => error);
      })
    );
  }

  updateProfile(data: UpdateProfileRequest): Observable<{ message: string; user: User }> {
    return this.apiService.put<any>('auth/profile', data).pipe(
      map((response: any) => {
        const backendUser = response.data || response;
        const updatedUser: User = {
          userId: backendUser.userId || backendUser.id,
          fullName: backendUser.fullName || data.fullName,
          email: backendUser.email,
          phoneNumber: backendUser.phoneNumber || data.phoneNumber,
          role: backendUser.role as UserRole,
          avatar: backendUser.avatarUrl || backendUser.avatar || data.avatar,
          createdAt: backendUser.createdAt ? new Date(backendUser.createdAt) : new Date(),
          updatedAt: new Date()
        };
        
        // Update current user
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        
        return {
          message: response.message || 'Cập nhật thông tin thành công',
          user: updatedUser
        };
      }),
      catchError(error => {
        console.error('Update profile error:', error);
        return throwError(() => error);
      })
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role!) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isCourtManager(): boolean {
    return this.hasRole(UserRole.COURT_MANAGER);
  }

  isCustomer(): boolean {
    return this.hasRole(UserRole.CUSTOMER);
  }

  isAdminOrManager(): boolean {
    return this.hasAnyRole([UserRole.ADMIN, UserRole.COURT_MANAGER]);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('[AuthService] No refresh token available');
      return throwError(() => new Error('No refresh token available'));
    }
    
    console.log('[AuthService] Calling refresh token API...');
    return this.apiService.post<any>('auth/refresh', { refreshToken }).pipe(
      tap((response) => console.log('[AuthService] Refresh token API response:', response)),
      map((backendResponse: any) => {
        const authResponse: AuthResponse = {
          token: backendResponse.data?.token || backendResponse.token,
          refreshToken: backendResponse.data?.refreshToken || backendResponse.refreshToken,
          user: this.getCurrentUser() || {
            userId: backendResponse.data?.id || backendResponse.id,
            fullName: backendResponse.data?.fullName || backendResponse.fullName,
            email: backendResponse.data?.email || backendResponse.email,
            role: (backendResponse.data?.role || backendResponse.role) as UserRole
          },
          expiresIn: 86400
        };
        this.setAuthData(authResponse);
        console.log('[AuthService] Token refreshed successfully, new token saved');
        return authResponse;
      }),
      catchError(error => {
        console.error('[AuthService] Refresh token error:', error);
        this.clearAuthData(); // Clear auth data on refresh failure
        return throwError(() => error);
      })
    );
  }

  private setAuthData(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.clearAuthData();
      }
    }
  }
}

