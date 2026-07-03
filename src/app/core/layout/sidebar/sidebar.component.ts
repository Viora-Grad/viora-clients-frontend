import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { AuthStore } from '../../auth/stores/auth.store';
import { BranchStore } from '../../branch/stores/branch.store';
import { TenantStore } from '../../tenant/stores/tenant.store';
import { NavItem } from '../models/nav-item.model';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-sidebar',
	imports: [RouterLink, RouterLinkActive, Dialog],
	templateUrl: './sidebar.component.html',
	styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
	private readonly _authStore = inject(AuthStore);
	private readonly _branchStore = inject(BranchStore);
	private readonly _tenantStore = inject(TenantStore);

	public readonly items = input<NavItem[]>([]);

	protected readonly branchModalVisible = signal(false);

	protected readonly branches = this._branchStore.branches;

	protected readonly currentBranchId = this._branchStore.currentBranchId;

	protected readonly isOrganizationLevel = this._branchStore.isOrganizationLevel;

	protected readonly isStaff = computed(() => this._authStore.isStaff() === true);

	protected readonly currentManagingLabel = computed(() => {
		if (this._branchStore.isOrganizationLevel()) {
			return this._tenantStore.slug()?.toUpperCase() ?? 'Organization';
		}
		const branch = this._branchStore.currentBranch();
		return branch?.address ?? 'Unknown Branch';
	});

	protected readonly userInitials = computed(() => {
		const user = this._authStore.currentUser();
		const first = user?.firstName?.charAt(0) ?? '';
		const last = user?.lastName?.charAt(0) ?? '';
		return (first + last).toUpperCase() || 'UN';
	});

	protected readonly userName = computed(() => {
		const user = this._authStore.currentUser();
		const first = user?.firstName ?? '';
		const last = user?.lastName ?? '';
		return `${first} ${last}`.trim() || 'User Name';
	});

	protected readonly userRole = computed(() => {
		return this._authStore.isStaff() ? 'Staff' : 'Owner';
	});

	protected openBranchModal(): void {
		this.branchModalVisible.set(true);
	}

	protected closeBranchModal(): void {
		this.branchModalVisible.set(false);
	}

	protected selectBranch(branchId: string | null): void {
		this._branchStore.setCurrentBranch(branchId);
		this.branchModalVisible.set(false);
	}
}
