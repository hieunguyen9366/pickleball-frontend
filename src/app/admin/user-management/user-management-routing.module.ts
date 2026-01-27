import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'customers',
        loadComponent: () => import('./customers/customer-list.component').then(c => c.CustomerListComponent)
    },
    {
        path: 'customers/:id/bookings',
        loadComponent: () => import('./customers/customer-bookings/customer-bookings.component').then(c => c.CustomerBookingsComponent)
    },
    {
        path: 'managers',
        loadComponent: () => import('./managers/manager-list.component').then(c => c.ManagerListComponent)
    },
    {
        path: 'managers/:id/assignment',
        loadComponent: () => import('./managers/manager-assignment/manager-assignment.component').then(c => c.ManagerAssignmentComponent)
    },
    {
        path: 'admins',
        loadComponent: () => import('./admins/admin-list/admin-list.component').then(c => c.AdminListComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UserManagementRoutingModule { }
