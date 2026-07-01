import { Routes } from '@angular/router';
import { tenantGuard } from './core/tenant/guards/tenant.guard';

export const routes: Routes = [
	{
		path: '',
		canActivate: [tenantGuard],
		children: [
			{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
			{
				path: 'dashboard',
				loadComponent: () =>
					import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
			},
		],
	},
];
