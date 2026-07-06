import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BranchStore } from '../../branch/stores/branch.store';
import { NavItem } from '../models/nav-item.model';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-shell',
	imports: [RouterOutlet, SidebarComponent],
	templateUrl: './shell.component.html',
	styleUrl: './shell.component.css',
})
export class ShellComponent {
	private readonly _branchStore = inject(BranchStore);
	private readonly _router = inject(Router);

	private readonly _organizationNavItems: NavItem[] = [
		{ label: 'Overview', icon: 'pi pi-th-large', route: '/overview' },
		{ label: 'Organization', icon: 'pi pi-sitemap', route: '/organization' },
		{ label: 'Branches', icon: 'pi pi-building', route: '/branches' },
		{ label: 'Staff', icon: 'pi pi-users', route: '/staffs' },
		{ label: 'Roles', icon: 'pi pi-user-edit', route: '/roles' },
		{ label: 'Billing', icon: 'pi pi-dollar', route: '/billing' },
	];

	private readonly _branchNavItems: NavItem[] = [
		{ label: 'Schedule', icon: 'pi pi-calendar', route: '/branch-management/schedule' },
		{ label: 'Appointments', icon: 'pi pi-calendar-clock', route: '/branch-management/appointments' },
		{ label: 'Services', icon: 'pi pi-briefcase', route: '/branch-management/services' },
		{ label: 'Staff', icon: 'pi pi-users', route: '/branch-management/staffs' },
		{ label: 'Organization', icon: 'pi pi-sitemap', route: '/branch-management/organization' },
		{ label: 'Branches', icon: 'pi pi-building', route: '/branch-management/branches' },
		{ label: 'Roles', icon: 'pi pi-user-edit', route: '/branch-management/roles' },
		{ label: 'Billing', icon: 'pi pi-dollar', route: '/branch-management/billing' },
	];

	public readonly navItems = computed(() =>
		this._branchStore.isOrganizationLevel() ? this._organizationNavItems : this._branchNavItems,
	);

	public constructor() {
		effect(() => {
			const isOrgLevel = this._branchStore.isOrganizationLevel();
			if (isOrgLevel) {
				void this._router.navigate([this._organizationNavItems[0].route]);
			} else {
				void this._router.navigate([this._branchNavItems[0].route]);
			}
		});
	}
}
