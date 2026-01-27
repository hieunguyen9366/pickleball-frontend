import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayerLayoutComponent } from './layouts/player-layout/player-layout.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { playerGuard } from './guards/player.guard';

const routes: Routes = [
  {
    path: '',
    component: PlayerLayoutComponent,
    canActivate: [playerGuard], // Prevent admin/manager from accessing player site
    children: [
      {
        path: '',
        redirectTo: 'landing',
        pathMatch: 'full'
      },
      // Landing Page
      {
        path: 'landing',
        loadComponent: () => import('./modules/landing/landing.component').then(c => c.LandingComponent)
      },
      // Authentication - Guest only
      {
        path: 'login',
        loadComponent: () => import('./modules/authentication/login/login.component').then(c => c.LoginComponent),
        canActivate: [guestGuard]
      },
      {
        path: 'register',
        loadComponent: () => import('./modules/authentication/register/register.component').then(c => c.RegisterComponent),
        canActivate: [guestGuard]
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./modules/authentication/forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent),
        canActivate: [guestGuard]
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./modules/authentication/reset-password/reset-password.component').then(c => c.ResetPasswordComponent),
        canActivate: [guestGuard]
      },
      {
        path: 'verify-email',
        loadComponent: () => import('./modules/authentication/verify-email/verify-email.component').then(c => c.VerifyEmailComponent)
      },
      // Court Search - Public
      {
        path: 'court-search',
        loadComponent: () => import('./modules/court-search/search/search.component').then(c => c.SearchComponent)
      },
      {
        path: 'court-detail/:id',
        loadComponent: () => import('./modules/court-search/detail/detail.component').then(c => c.DetailComponent)
      },
      // Account - Auth required
      {
        path: 'account/profile',
        loadComponent: () => import('./modules/account/profile/profile.component').then(c => c.ProfileComponent),
        canActivate: [authGuard]
      },
      // Booking - Auth required
      {
        path: 'booking/select-court',
        loadComponent: () => import('./modules/booking/select-court/select-court.component').then(c => c.SelectCourtComponent),
        canActivate: [authGuard]
      },
      {
        path: 'booking/select-services',
        loadComponent: () => import('./modules/booking/select-services/select-services.component').then(c => c.SelectServicesComponent),
        canActivate: [authGuard]
      },
      {
        path: 'booking/payment',
        loadComponent: () => import('./modules/booking/payment/payment.component').then(c => c.PaymentComponent),
        canActivate: [authGuard]
      },
      {
        path: 'booking/confirmation/:id',
        loadComponent: () => import('./modules/booking/confirmation/confirmation.component').then(c => c.ConfirmationComponent),
        canActivate: [authGuard]
      },
      // My Bookings - Auth required
      {
        path: 'my-bookings',
        loadComponent: () => import('./modules/my-bookings/list/list.component').then(c => c.ListComponent),
        canActivate: [authGuard]
      },
      {
        path: 'my-bookings/:id',
        loadComponent: () => import('./modules/my-bookings/detail/detail.component').then(c => c.DetailComponent),
        canActivate: [authGuard]
      },
      {
        path: 'my-bookings/:id/cancel',
        loadComponent: () => import('./modules/my-bookings/cancel/cancel.component').then(c => c.CancelComponent),
        canActivate: [authGuard]
      },
      // Notifications - Auth required
      {
        path: 'notifications',
        loadComponent: () => import('./modules/notifications/list/list.component').then(c => c.ListComponent),
        canActivate: [authGuard]
      },
      {
        path: 'notifications/:id',
        loadComponent: () => import('./modules/notifications/detail/detail.component').then(c => c.DetailComponent),
        canActivate: [authGuard]
      }
    ]
  }
];

export const playerRoutes: Routes = routes;

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlayerRoutingModule { }

