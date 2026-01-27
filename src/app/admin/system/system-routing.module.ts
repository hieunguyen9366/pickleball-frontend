import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component').then(c => c.SettingsComponent)
    },
    {
        path: 'pricing',
        loadComponent: () => import('./pricing-settings/pricing-settings.component').then(c => c.PricingSettingsComponent)
    },
    {
        path: 'payment',
        loadComponent: () => import('./payment-settings/payment-settings.component').then(c => c.PaymentSettingsComponent)
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SystemRoutingModule { }



