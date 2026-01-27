import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'list',
        loadComponent: () => import('./booking-list/booking-list.component').then(c => c.BookingListComponent)
    },
    {
        path: 'calendar',
        loadComponent: () => import('./booking-calendar/booking-calendar.component').then(c => c.BookingCalendarComponent)
    },
    // Removed create route - only players can create bookings
    {
        path: ':id',
        loadComponent: () => import('./booking-detail/booking-detail.component').then(c => c.BookingDetailComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BookingManagementRoutingModule { }
