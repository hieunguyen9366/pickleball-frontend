// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminLayout } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';
import { rootRedirectGuard } from './common/guards/root-redirect.guard';

const routes: Routes = [
  // Default redirect based on user role
  {
    path: '',
    canActivate: [rootRedirectGuard],
    children: []
  },
  // Main Admin Routes
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        loadChildren: () => import('./admin/admin-routing.module').then(m => m.adminRoutes)
      }
    ]
  },
  // Legacy/Demo Admin routes (keep for reference or remove if requested)
  {
    path: 'demo',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirectTo: '/dashboard/default',
        pathMatch: 'full'
      },
      {
        path: 'dashboard/default',
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent)
      },
      {
        path: 'typography',
        loadComponent: () => import('./demo/component/basic-component/typography/typography.component').then((c) => c.TypographyComponent)
      },
      {
        path: 'color',
        loadComponent: () => import('./demo/component/basic-component/color/color.component').then((c) => c.ColorComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./demo/others/sample-page/sample-page.component').then((c) => c.SamplePageComponent)
      }
    ]
  },
  // Guest routes (Admin)
  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./demo/pages/authentication/auth-login/auth-login.component').then((c) => c.AuthLoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./demo/pages/authentication/auth-register/auth-register.component').then((c) => c.AuthRegisterComponent)
      }
    ]
  },
  // Admin authentication
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/modules/authentication/login/login.component').then((c) => c.AdminLoginComponent)
  },
  // Player routes
  {
    path: 'player',
    loadChildren: () => import('./player/player-routing.module').then(m => m.playerRoutes)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top', // Luôn scroll về đầu trang khi navigate
    anchorScrolling: 'enabled' // Cho phép scroll đến anchor nếu có
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
