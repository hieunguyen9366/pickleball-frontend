import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { roleGuard } from './guards/role.guard';
import { UserRole } from '../player/models/user.model';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
        canActivate: [adminGuard]
    },
    {
        path: 'court-management',
        loadChildren: () => import('./court-management/court-management-routing.module').then(m => m.CourtManagementRoutingModule),
        canActivate: [adminGuard]
    },
    {
        path: 'booking-management',
        loadChildren: () => import('./booking-management/booking-management-routing.module').then(m => m.BookingManagementRoutingModule),
        canActivate: [adminGuard]
    },
    {
        path: 'service-management',
        loadChildren: () => import('./service-management/service-management-routing.module').then(m => m.ServiceManagementRoutingModule),
        canActivate: [adminGuard]
    },
    {
        path: 'user-management',
        loadChildren: () => import('./user-management/user-management-routing.module').then(m => m.UserManagementRoutingModule),
        canActivate: [roleGuard([UserRole.ADMIN])] // Only ADMIN can manage users
    },
    {
        path: 'reports',
        loadChildren: () => import('./reports/reports-routing.module').then(m => m.ReportsRoutingModule),
        canActivate: [adminGuard]
    },
    {
        path: 'system',
        loadChildren: () => import('./system/system-routing.module').then(m => m.SystemRoutingModule),
        canActivate: [roleGuard([UserRole.ADMIN])] // Only ADMIN can access system settings
    }
];

export const adminRoutes: Routes = routes;

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
