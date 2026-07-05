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
				path: 'staffs/create',
				loadComponent: () =>
					import('./features/authentication/pages/register-staff/register-staff.page').then(
						(m) => m.RegisterStaffPage,
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
					{
						path: 'branches/create',
						loadComponent: () =>
							import('./features/branches/pages/create-branch/create-branch.page').then(
								(m) => m.CreateBranchPage,
							),
					},
					{
						path: 'branches/:id',
						loadComponent: () =>
							import('./features/branches/pages/branch-details/branch-details.page').then(
								(m) => m.BranchDetailsPage,
							),
					},
					{
						path: 'staffs',
						loadComponent: () =>
							import('./features/staff/pages/staff/staff.page').then((m) => m.StaffPage),
					},
					{
						path: 'staffs/invite',
						loadComponent: () =>
							import('./features/staff/pages/create-staff/create-staff.page').then(
								(m) => m.CreateStaffPage,
							),
					},
					{
						path: 'roles',
						loadComponent: () =>
							import('./features/roles/pages/roles/roles.page').then((m) => m.RolesPage),
					},
					{
						path: 'roles/create',
						loadComponent: () =>
							import('./features/roles/pages/create-role/create-role.page').then(
								(m) => m.CreateRolePage,
							),
					},
					{
						path: 'profile',
						loadComponent: () =>
							import('./features/profile/pages/profile/profile.page').then((m) => m.ProfilePage),
					},
				],
			},
		],
	},
];
