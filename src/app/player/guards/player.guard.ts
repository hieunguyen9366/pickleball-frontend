import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Player Guard - Ensures only CUSTOMER role can access player routes
 * Redirects ADMIN and COURT_MANAGER to admin site
 */
export const playerGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // If not authenticated, allow access to public player routes
    if (!authService.isAuthenticated()) {
        return true;
    }

    const user = authService.getCurrentUser();

    // If user is CUSTOMER, allow access to player site
    if (user && user.role === UserRole.CUSTOMER) {
        return true;
    }

    // If user is ADMIN or COURT_MANAGER, redirect to admin site
    if (user && (user.role === UserRole.ADMIN || user.role === UserRole.COURT_MANAGER)) {
        router.navigate(['/admin/dashboard']);
        return false;
    }

    // For any other case, allow access
    return true;
};
