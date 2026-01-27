import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../player/services/auth.service';
import { UserRole } from '../../player/models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/admin/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }

    const user = authService.getCurrentUser();
    if (user && allowedRoles.includes(user.role!)) {
      return true;
    }

    // Redirect to dashboard if not authorized
    router.navigate(['/admin/dashboard']);
    return false;
  };
};



