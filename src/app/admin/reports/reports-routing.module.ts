import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'revenue',
        loadComponent: () => import('./revenue-report/revenue-report.component').then(c => c.RevenueReportComponent)
    },
    {
        path: 'occupancy',
        loadComponent: () => import('./occupancy-report/occupancy-report.component').then(c => c.OccupancyReportComponent)
    },
    {
        path: 'top-courts',
        loadComponent: () => import('./top-courts-report/top-courts-report.component').then(c => c.TopCourtsReportComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ReportsRoutingModule { }



