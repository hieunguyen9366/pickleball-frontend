import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../player/services/auth.service';
import { UserRole } from '../../player/models/user.model';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Redirect to admin login if not authenticated
    router.navigate(['/admin/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const user = authService.getCurrentUser();

  // Check if user is admin or court manager
  if (user && (user.role === UserRole.ADMIN || user.role === UserRole.COURT_MANAGER)) {
    return true;
  }

  // If user is a CUSTOMER (player), redirect to player site
  if (user && user.role === UserRole.CUSTOMER) {
    router.navigate(['/player/landing']);
    return false;
  }

  // For any other case, redirect to player site
  router.navigate(['/player/landing']);
  return false;
};



