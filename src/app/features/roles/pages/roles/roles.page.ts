import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Role } from '../../../../core/role/models/role.model';
import { RoleService } from '../../../../core/role/services/role.service';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-roles',
	imports: [TableModule, Button, RouterLink],
	templateUrl: './roles.page.html',
	styleUrl: './roles.page.css',
})
export class RolesPage implements OnInit {
	private readonly _roleService = inject(RoleService);
	private readonly _tenantStore = inject(TenantStore);

	protected readonly roles = signal<Role[]>([]);
	protected readonly isLoading = signal(false);

	public ngOnInit(): void {
		this._loadRoles();
	}

	private _loadRoles(): void {
		const organizationId = this._tenantStore.organizationId();
		if (!organizationId) return;

		this.isLoading.set(true);
		this._roleService.getRoles(organizationId).subscribe({
			next: (roles) => {
				this.roles.set(roles);
				this.isLoading.set(false);
			},
			error: () => {
				this.isLoading.set(false);
			},
		});
	}
}
