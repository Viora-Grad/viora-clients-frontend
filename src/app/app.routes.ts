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
						path: 'staffs/:id',
						loadComponent: () =>
							import('./features/staff/pages/staff-details/staff-details.page').then(
								(m) => m.StaffDetailsPage,
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
					{
						path: 'branch-management',
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
								path: 'schedule',
								loadComponent: () =>
									import('./features/schedule/pages/schedule/schedule.page').then(
										(m) => m.SchedulePage,
									),
							},
							{
								path: 'appointments',
								loadComponent: () =>
									import('./features/appointments/pages/appointments/appointments.page').then(
										(m) => m.AppointmentsPage,
									),
							},
							{
								path: 'services',
								loadComponent: () =>
									import('./features/services/pages/services/services.page').then(
										(m) => m.ServicesPage,
									),
							},
							{
								path: 'services/:id/form',
								loadComponent: () =>
									import('./features/services/pages/service-form/service-form.page').then(
										(m) => m.ServiceFormPage,
									),
							},
							{
								path: 'staffs',
								loadComponent: () =>
									import('./features/staff/pages/branch-staff/branch-staff.page').then(
										(m) => m.BranchStaffPage,
									),
							},
							{
								path: 'wallet',
								loadComponent: () =>
									import('./features/wallet/pages/wallet/wallet.page').then(
										(m) => m.WalletPage,
									),
							},
						],
					},
					{
						path: 'organization',
						loadComponent: () =>
							import('./features/organization/pages/organization/organization.page').then((m) => m.OrganizationPage),
					},
					{
						path: 'organization/edit',
						loadComponent: () => import('./features/organization/pages/organizationEdit/organizationEdit.page').then(m => m.OrganizationEditPage),
					},
				],
			},
		],
	},
];
