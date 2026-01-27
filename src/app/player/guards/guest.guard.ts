import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  const user = authService.getCurrentUser();

  // Redirect based on user role
  if (user && (user.role === UserRole.ADMIN || user.role === UserRole.COURT_MANAGER)) {
    router.navigate(['/admin/dashboard']);
  } else {
    router.navigate(['/player/landing']);
  }

  return false;
};




