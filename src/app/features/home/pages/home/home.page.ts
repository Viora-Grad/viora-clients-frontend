import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AuthStore } from '../../../../core/auth/stores/auth.store';
import { TenantStore } from '../../../../core/tenant/stores/tenant.store';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-home',
	imports: [],
	template: `
		<div class="flex min-h-screen items-center justify-center bg-gray-50">
			<div class="text-center">
				<h1 class="text-2xl font-bold text-gray-900">Home</h1>
				<p class="mt-2 text-gray-500">User ID: {{ authStore.currentUser()?.id }}</p>
				<p class="mt-1 text-sm text-gray-400">Org ID: {{ tenantStore.organizationId() }}</p>
				<button
					type="button"
					(click)="onLogout()"
					class="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
				>
					Logout
				</button>
			</div>
		</div>
	`,
})
export class HomePage {
	protected readonly authStore = inject(AuthStore);
	protected readonly tenantStore = inject(TenantStore);
	private readonly _authService = inject(AuthService);

	protected onLogout(): void {
		this._authService.logout();
	}
}
