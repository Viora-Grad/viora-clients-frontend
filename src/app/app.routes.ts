import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { guestGuard } from './core/auth/guards/guest.guard';
import { tenantGuard } from './core/tenant/guards/tenant.guard';

export const routes: Routes = [
	{
		path: '',
		canActivate: [tenantGuard],
		children: [
			{
				path: 'auth/login',
				canActivate: [guestGuard],
				loadComponent: () =>
					import('./features/authentication/pages/login/login.page').then((m) => m.LoginPage),
			},
			{
				path: 'auth/owner/callback',
				loadComponent: () =>
					import('./features/authentication/pages/owner-callback/owner-callback.page').then(
						(m) => m.OwnerCallbackPage,
					),
			},
			{
				path: '',
				canActivate: [authGuard],
				loadComponent: () =>
					import('./core/layout/shell/shell.component').then((m) => m.ShellComponent),
				children: [
					{
						path: '',
						redirectTo: 'overview',
						pathMatch: 'full',
					},
				{
					path: 'overview',
					loadComponent: () =>
						import('./features/home/pages/home/home.page').then((m) => m.HomePage),
				},
				{
					path: 'branches',
					loadComponent: () =>
						import('./features/branches/pages/branches/branches.page').then(
							(m) => m.BranchesPage,
						),
				},
				],
			},
		],
	},
];
