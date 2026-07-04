import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
	public readonly navItems = signal<NavItem[]>([
		{ label: 'Overview', icon: 'pi pi-th-large', route: '/overview' },
		{ label: 'Organization', icon: 'pi pi-sitemap', route: '/organization' },
		{ label: 'Branches', icon: 'pi pi-building', route: '/branches' },
		{ label: 'Staff', icon: 'pi pi-users', route: '/staff' },
		{ label: 'Roles', icon: 'pi pi-user-edit', route: '/roles' },
		{ label: 'Billing', icon: 'pi pi-dollar', route: '/billing' },
	]);
}
