import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'clusters',
        loadComponent: () => import('./cluster-list/cluster-list.component').then(c => c.ClusterListComponent)
    },
    {
        path: 'courts',
        loadComponent: () => import('./court-list/court-list.component').then(c => c.CourtListComponent)
    },
    {
        path: 'time-slots',
        loadComponent: () => import('./time-slots/time-slot-list/time-slot-list.component').then(c => c.TimeSlotListComponent)
    },
    {
        path: 'pricing',
        redirectTo: 'pricing/dynamic',
        pathMatch: 'full'
    },
    {
        path: 'pricing/dynamic',
        loadComponent: () => import('./pricing/dynamic-pricing/dynamic-pricing.component').then(c => c.DynamicPricingComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CourtManagementRoutingModule { }
