import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();

    // If admin or manager tries to access player protected routes, redirect to admin
    if (user && (user.role === UserRole.ADMIN || user.role === UserRole.COURT_MANAGER)) {
      router.navigate(['/admin/dashboard']);
      return false;
    }

    return true;
  }

  // Lưu URL hiện tại để redirect sau khi đăng nhập
  router.navigate(['/player/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};




