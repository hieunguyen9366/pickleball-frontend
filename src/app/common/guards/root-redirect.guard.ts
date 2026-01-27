import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../player/services/auth.service';
import { UserRole } from '../../player/models/user.model';

/**
 * Root redirect guard - Redirects users to appropriate site based on their role
 */
export const rootRedirectGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser();

        // Redirect admin/manager to admin dashboard
        if (user && (user.role === UserRole.ADMIN || user.role === UserRole.COURT_MANAGER)) {
            router.navigate(['/admin/dashboard']);
            return false;
        }

        // Redirect customer to player landing
        if (user && user.role === UserRole.CUSTOMER) {
            router.navigate(['/player/landing']);
            return false;
        }
    }

    // Default redirect to player landing for guests
    router.navigate(['/player/landing']);
    return false;
};
